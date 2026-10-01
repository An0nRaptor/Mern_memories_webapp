import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { connectDB, photoBucket } from "./db.js";
import User from "./models/User.js";
import Post from "./models/Post.js";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PAGE_SIZE = 12;

const app = express();
app.disable("x-powered-by");

// On Netlify the function sees /.netlify/functions/api/...; locally it's /api/...
app.use((req, _res, next) => {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api/, "/api");
    next();
});
app.use(express.json({ limit: "1mb" }));
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
const route = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isId = id => mongoose.isValidObjectId(id);
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const signToken = user => jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "7d" });

function readToken(req) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).sub;
    } catch {
        return undefined; // present but invalid
    }
}

function requireAuth(req, _res, next) {
    const userId = readToken(req);
    if (!userId) return next(new HttpError(401, userId === null ? "Please log in first." : "Your session has expired. Please log in again."));
    req.userId = userId;
    next();
}

// Public routes still personalise (e.g. "liked by me") when a token is sent.
function optionalAuth(req, _res, next) {
    req.userId = readToken(req) || null;
    next();
}

const AUTHOR_FIELDS = "name";

// Lists send counts, not full like/comment arrays.
function toCard(post, userId) {
    return {
        _id: post._id,
        title: post.title,
        message: post.message.length > 220 ? post.message.slice(0, 220).trimEnd() + "…" : post.message,
        tags: post.tags,
        photo: post.photo,
        author: post.author,
        createdAt: post.createdAt,
        likeCount: post.likes.length,
        likedByMe: Boolean(userId && post.likes.some(id => String(id) === userId)),
        commentCount: post.comments.length
    };
}

function toDetail(post, userId) {
    return {
        ...toCard(post, userId),
        message: post.message,
        updatedAt: post.updatedAt,
        comments: post.comments.map(c => ({ _id: c._id, text: c.text, author: c.author, createdAt: c.createdAt }))
    };
}

function cleanTags(tags) {
    if (!Array.isArray(tags)) return [];
    const seen = new Set();
    for (const t of tags) {
        const tag = String(t).toLowerCase().trim().replace(/^#/, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
        if (tag) seen.add(tag);
    }
    return [...seen].slice(0, 8);
}

// ---------- Auth ----------

app.post("/api/auth/register", route(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || !password) throw new HttpError(400, "Name, email and password are required.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Please enter a valid email address.");
    if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
    if (await User.exists({ email })) throw new HttpError(409, "An account with this email already exists.");
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
}));

app.post("/api/auth/login", route(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password))) {
        throw new HttpError(401, "Incorrect email or password.");
    }
    res.json({ token: signToken(user), user: user.toPublic() });
}));

app.get("/api/auth/me", requireAuth, route(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "Account not found.");
    res.json({ user: user.toPublic() });
}));

app.patch("/api/auth/me", requireAuth, route(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "Account not found.");
    if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) throw new HttpError(400, "Name can't be empty.");
        user.name = name.slice(0, 60);
    }
    if (req.body.bio !== undefined) user.bio = String(req.body.bio).trim().slice(0, 160);
    await user.save();
    res.json({ user: user.toPublic() });
}));

// ---------- Photos (GridFS) ----------

function savePhoto(buffer, contentType, filename) {
    return new Promise((resolve, reject) => {
        const stream = photoBucket().openUploadStream(filename || "photo", { metadata: { contentType } });
        stream.on("error", reject).on("finish", () => resolve(`/api/photos/${stream.id}`));
        stream.end(buffer);
    });
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => cb(file.mimetype.startsWith("image/") ? null : new HttpError(400, "Only image files are allowed."), true)
});

app.post("/api/upload", requireAuth, upload.single("photo"), route(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No photo received.");
    res.status(201).json({ url: await savePhoto(req.file.buffer, req.file.mimetype, req.file.originalname) });
}));

app.get("/api/photos/:id", route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Photo not found.");
    const id = new mongoose.Types.ObjectId(req.params.id);
    const [file] = await photoBucket().find({ _id: id }).toArray();
    if (!file) throw new HttpError(404, "Photo not found.");
    const chunks = [];
    for await (const chunk of photoBucket().openDownloadStream(id)) chunks.push(chunk);
    res.set({ "Content-Type": file.metadata?.contentType || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" });
    res.send(Buffer.concat(chunks));
}));

// ---------- Posts ----------

app.get("/api/posts", optionalAuth, route(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const filter = {};
    const q = String(req.query.q || "").trim();
    if (q) {
        const re = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ title: re }, { message: re }, { tags: q.toLowerCase().replace(/^#/, "") }];
    }
    if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
    if (req.query.author && isId(req.query.author)) filter.author = req.query.author;
    if (req.query.liked === "me" && req.userId) filter.likes = req.userId;

    const sort = req.query.sort === "popular" ? { likeCount: -1, createdAt: -1 } : { createdAt: -1 };
    const [total, posts] = await Promise.all([
        Post.countDocuments(filter),
        req.query.sort === "popular"
            ? Post.aggregate([
                  { $match: { ...filter, ...(filter.author && { author: new mongoose.Types.ObjectId(String(filter.author)) }), ...(filter.likes && { likes: new mongoose.Types.ObjectId(req.userId) }) } },
                  { $addFields: { likeCount: { $size: "$likes" } } },
                  { $sort: sort },
                  { $skip: (page - 1) * PAGE_SIZE },
                  { $limit: PAGE_SIZE }
              ]).then(docs => Post.populate(docs, { path: "author", select: AUTHOR_FIELDS }))
            : Post.find(filter).sort(sort).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).populate("author", AUTHOR_FIELDS)
    ]);
    res.json({
        posts: posts.map(p => toCard(p, req.userId)),
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        total
    });
}));

app.get("/api/posts/:id", optionalAuth, route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Memory not found.");
    const post = await Post.findById(req.params.id).populate("author", AUTHOR_FIELDS).populate("comments.author", AUTHOR_FIELDS);
    if (!post) throw new HttpError(404, "Memory not found.");
    res.json(toDetail(post, req.userId));
}));

app.get("/api/posts/:id/related", optionalAuth, route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Memory not found.");
    const post = await Post.findById(req.params.id, { tags: 1 });
    if (!post) throw new HttpError(404, "Memory not found.");
    const related = await Post.find({ _id: { $ne: post._id }, tags: { $in: post.tags } })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("author", AUTHOR_FIELDS);
    res.json(related.map(p => toCard(p, req.userId)));
}));

function postFields(body) {
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    if (!title || !message) throw new HttpError(400, "A title and a story are required.");
    const photo = typeof body.photo === "string" && body.photo.startsWith("/api/photos/") ? body.photo : "";
    return { title: title.slice(0, 120), message: message.slice(0, 5000), tags: cleanTags(body.tags), photo };
}

app.post("/api/posts", requireAuth, route(async (req, res) => {
    const post = await Post.create({ ...postFields(req.body), author: req.userId });
    await post.populate("author", AUTHOR_FIELDS);
    res.status(201).json(toDetail(post, req.userId));
}));

async function ownPost(req) {
    if (!isId(req.params.id)) throw new HttpError(404, "Memory not found.");
    const post = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, "Memory not found.");
    if (String(post.author) !== req.userId) throw new HttpError(403, "You can only change your own memories.");
    return post;
}

app.patch("/api/posts/:id", requireAuth, route(async (req, res) => {
    const post = await ownPost(req);
    post.set(postFields(req.body));
    await post.save();
    await post.populate([{ path: "author", select: AUTHOR_FIELDS }, { path: "comments.author", select: AUTHOR_FIELDS }]);
    res.json(toDetail(post, req.userId));
}));

app.delete("/api/posts/:id", requireAuth, route(async (req, res) => {
    const post = await ownPost(req);
    await post.deleteOne();
    res.status(204).end();
}));

// Toggle; atomic so double-clicks can't double-count.
app.post("/api/posts/:id/like", requireAuth, route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Memory not found.");
    const me = new mongoose.Types.ObjectId(req.userId);
    const liked = await Post.exists({ _id: req.params.id, likes: me });
    const post = await Post.findByIdAndUpdate(req.params.id, liked ? { $pull: { likes: me } } : { $addToSet: { likes: me } }, { new: true, timestamps: false });
    if (!post) throw new HttpError(404, "Memory not found.");
    res.json({ likeCount: post.likes.length, likedByMe: !liked });
}));

app.post("/api/posts/:id/comments", requireAuth, route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Memory not found.");
    const text = String(req.body.text || "").trim();
    if (!text) throw new HttpError(400, "Comment can't be empty.");
    const post = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: { author: req.userId, text: text.slice(0, 1000) } } },
        { new: true, timestamps: false }
    ).populate("comments.author", AUTHOR_FIELDS);
    if (!post) throw new HttpError(404, "Memory not found.");
    const c = post.comments[post.comments.length - 1];
    res.status(201).json({ _id: c._id, text: c.text, author: c.author, createdAt: c.createdAt });
}));

// Comment author or the post's owner can remove a comment.
app.delete("/api/posts/:id/comments/:commentId", requireAuth, route(async (req, res) => {
    if (!isId(req.params.id) || !isId(req.params.commentId)) throw new HttpError(404, "Comment not found.");
    const post = await Post.findById(req.params.id);
    const comment = post?.comments.id(req.params.commentId);
    if (!comment) throw new HttpError(404, "Comment not found.");
    if (String(comment.author) !== req.userId && String(post.author) !== req.userId) {
        throw new HttpError(403, "You can't delete this comment.");
    }
    comment.deleteOne();
    await post.save({ timestamps: false });
    res.status(204).end();
}));

// ---------- Discovery ----------

app.get("/api/tags", route(async (_req, res) => {
    const tags = await Post.aggregate([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 15 }
    ]);
    res.json(tags.map(t => ({ tag: t._id, count: t.count })));
}));

app.get("/api/users/:id", route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "User not found.");
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, "User not found.");
    const [stats] = await Post.aggregate([
        { $match: { author: user._id } },
        { $group: { _id: null, posts: { $sum: 1 }, likes: { $sum: { $size: "$likes" } }, comments: { $sum: { $size: "$comments" } } } }
    ]);
    res.json({
        user: { id: user._id, name: user.name, bio: user.bio, createdAt: user.createdAt },
        stats: { posts: stats?.posts || 0, likes: stats?.likes || 0, comments: stats?.comments || 0 }
    });
}));

// ---------- Fallbacks ----------

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found.")));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "Photos must be under 5 MB." : err.message });
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? "Something went wrong on our side. Please try again." : err.message });
});

export default app;
