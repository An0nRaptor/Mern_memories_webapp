// Seeds demo memories, authors, likes and comments: `npm run seed`.
// Safe to re-run: it replaces everything created by previous seeds.
// Photos are public-domain / CC0 images from Wikimedia Commons, copied into
// GridFS. Demo authors get random passwords; only the demo account is public.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB, photoBucket } from "./db.js";
import User from "./models/User.js";
import Post from "./models/Post.js";

const UA = { "User-Agent": "MemoriesSeed/1.0 (portfolio demo; rahulyadavaudi06@gmail.com)" };
const DEMO = { name: "Demo Traveller", email: "demo@memories.dev", password: "demo1234", bio: "Trying out Memories. Say hi in the comments!" };
const AUTHORS = [
    { key: "aanya", name: "Aanya Kapoor", bio: "Weekend wanderer from Delhi. Chasing sunrises and street food." },
    { key: "rohan", name: "Rohan Mehta", bio: "Mumbai architect. I travel for old buildings and good chai." },
    { key: "meera", name: "Meera Nair", bio: "Kerala girl in Bengaluru. Mountains > beaches (don’t tell my family)." },
    { key: "kabir", name: "Kabir Sethi", bio: "Bike trips, long roads, bad playlists." }
];

const DAY = 86400000;
const POSTS = [
    { by: "kabir", daysAgo: 1, photo: "File:Ladakh - Pangong Tso 1.jpg", title: "Pangong at 14,000 feet", tags: ["ladakh", "roadtrip", "mountains", "lakes"],
      message: "Five days on the bike from Manali and every bump was worth it. The lake changes colour every hour: turquoise at noon, deep blue by evening.\n\nPro tip: carry way more layers than you think. The wind off the water is no joke." },
    { by: "meera", daysAgo: 2, photo: "File:Beauty of Munnar.jpg", title: "Mist and tea in Munnar", tags: ["kerala", "munnar", "mountains", "tea"],
      message: "Woke up at 5:30 to catch the mist rolling over the tea estates. Walked for hours without seeing another person. Home-cooked appam and stew at the homestay afterwards. Perfect day." },
    { by: "rohan", daysAgo: 3, photo: "File:Gateway of India 15Nov23.jpg", title: "Morning walk to the Gateway", tags: ["mumbai", "architecture", "city"],
      message: "Lived in this city for ten years and still stop every time I see it. Early morning is the only time it’s quiet enough to actually look at the stonework." },
    { by: "aanya", daysAgo: 4, photo: "File:Taj Mahal 2018.jpg", title: "Finally, the Taj", tags: ["agra", "heritage", "architecture"],
      message: "Everyone says the photos don’t do it justice, and everyone is right. We got in right at opening and had twenty minutes before the crowds. Worth the 4 AM alarm." },
    { by: "meera", daysAgo: 6, photo: "File:A Houseboat In Kerala Backwaters.jpg", title: "A slow day on the backwaters", tags: ["kerala", "backwaters", "houseboat"],
      message: "Took my Bengaluru friends home for the long weekend and put them on a houseboat. No phones, karimeen fry for lunch, and nobody wanted to get off." },
    { by: "kabir", daysAgo: 8, photo: "File:071017 Virupaksha temple complex aerial view, Hampi Karnataka.jpg", title: "Lost among the ruins of Hampi", tags: ["hampi", "karnataka", "heritage", "roadtrip"],
      message: "Rented a cycle and spent two days riding between temples and boulders. The scale of this place is unreal: an entire empire’s capital, just sitting there in the sun." },
    { by: "aanya", daysAgo: 10, photo: "File:Palolem Beach India.jpg", title: "Palolem, off season", tags: ["goa", "beach", "sunset"],
      message: "Went in the shoulder season and had half the beach to ourselves. Kayaked to Butterfly Beach, ate way too much prawn curry rice." },
    { by: "rohan", daysAgo: 12, photo: "File:Elephant Trainer in the Udaipur City Palace (54429813427).jpg", title: "Courtyards of the City Palace", tags: ["udaipur", "rajasthan", "architecture", "heritage"],
      message: "Every courtyard opens into another one. Spent a whole afternoon sketching arches. Udaipur might be the most photogenic city in India." },
    { by: "meera", daysAgo: 15, photo: "File:Lakes of Munnar.jpg", title: "The lakes nobody tells you about", tags: ["munnar", "kerala", "lakes"],
      message: "Skipped the touristy viewpoints and asked our driver where he goes on his day off. Best decision of the trip." },
    { by: "kabir", daysAgo: 18, photo: "File:Ladakh - A Glimpse of Pangong Tso.jpg", title: "First glimpse", tags: ["ladakh", "lakes", "mountains"],
      message: "That moment the lake first appears over the ridge. Pulled over, turned the engine off, and just sat there for ten minutes." },
    { by: "rohan", daysAgo: 21, photo: "File:Gateway of India Silhouette.jpg", title: "Gateway after sunset", tags: ["mumbai", "city", "sunset"],
      message: "Same monument, completely different mood once the sun goes down." },
    { by: "aanya", daysAgo: 25, photo: "File:Kerala Houseboat Breakfast.JPG", title: "Breakfast on the water", tags: ["kerala", "food", "houseboat"],
      message: "Puttu, kadala curry and the strongest coffee of my life, served on the deck while the boat drifted. I’m still thinking about it." }
];

const COMMENTS = [
    "This is stunning 😍", "Adding this to my list right now.", "What time of year did you go?", "The colours!!",
    "I was there last year, brings back memories.", "How many days would you recommend?", "Okay I need to plan a trip.",
    "Beautiful shot.", "Did you need a permit for this?", "Saving this for later 🙌"
];

async function commonsUrls(titles) {
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    Object.entries({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1400", titles: titles.join("|") })
        .forEach(([k, v]) => u.searchParams.set(k, v));
    const json = await (await fetch(u, { headers: UA })).json();
    const byTitle = {};
    for (const p of Object.values(json.query.pages)) {
        const info = p.imageinfo?.[0];
        const license = info?.extmetadata?.LicenseShortName?.value || "";
        if (!info || !/^(CC0|Public domain|PD)/i.test(license)) throw new Error(`Not usable (${license || "missing"}): ${p.title}`);
        byTitle[p.title] = info.thumburl;
    }
    for (const n of json.query.normalized || []) byTitle[n.from] = byTitle[n.to];
    return titles.map(t => byTitle[t]);
}

async function storePhoto(url) {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return new Promise((resolve, reject) => {
        const stream = photoBucket().openUploadStream("seed.jpg", { metadata: { contentType: res.headers.get("content-type") || "image/jpeg", seed: true } });
        stream.on("error", reject).on("finish", () => resolve(`/api/photos/${stream.id}`));
        stream.end(buffer);
    });
}

// Deterministic pseudo-random, so re-seeding gives the same likes/comments.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

await connectDB();

// Remove previous seed data and throwaway test accounts.
const seedEmails = [...AUTHORS.map(a => `${a.key}@memories.dev`), DEMO.email];
const old = await User.find({ $or: [{ email: { $in: seedEmails } }, { email: /@test\.dev$/ }] });
await Post.deleteMany({ author: { $in: old.map(u => u._id) } });
await User.deleteMany({ _id: { $in: old.map(u => u._id) }, email: { $ne: DEMO.email } });
for (const f of await photoBucket().find({ "metadata.seed": true }).toArray()) await photoBucket().delete(f._id);

const users = {};
for (const a of AUTHORS) {
    users[a.key] = await User.create({ name: a.name, bio: a.bio, email: `${a.key}@memories.dev`, password: await bcrypt.hash(randomBytes(18).toString("base64url"), 10) });
}
const demoUser = await User.findOneAndUpdate(
    { email: DEMO.email },
    { name: DEMO.name, bio: DEMO.bio, email: DEMO.email, password: await bcrypt.hash(DEMO.password, 10) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
);
const everyone = [...Object.values(users), demoUser];

const urls = await commonsUrls(POSTS.map(p => p.photo));
for (const [i, p] of POSTS.entries()) {
    const createdAt = new Date(Date.now() - p.daysAgo * DAY - Math.floor(rand() * 8) * 3600000);
    const author = users[p.by];
    const others = everyone.filter(u => u !== author);
    const likers = pick(others, 1 + Math.floor(rand() * others.length));
    const commenters = pick(others.filter(u => u !== demoUser), Math.floor(rand() * 3));
    const comments = commenters.map((u, k) => ({
        author: u._id,
        text: COMMENTS[(i * 3 + k) % COMMENTS.length],
        createdAt: new Date(createdAt.getTime() + (k + 1) * 3 * 3600000)
    }));
    const post = await Post.create({ author: author._id, title: p.title, message: p.message, tags: p.tags, photo: await storePhoto(urls[i]), likes: likers.map(u => u._id), comments });
    // Backdate (timestamps would otherwise stamp "now").
    // createdAt is immutable in Mongoose, so write through the driver.
    await Post.collection.updateOne({ _id: post._id }, { $set: { createdAt, updatedAt: createdAt } });
    console.log(`✓ ${p.title}`);
}

console.log(`Seeded ${POSTS.length} memories by ${AUTHORS.length} authors. Demo login: ${DEMO.email} / ${DEMO.password}`);
await mongoose.disconnect();
