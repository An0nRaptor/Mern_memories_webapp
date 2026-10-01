import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, trim: true, maxlength: 1000 }
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
        tags: { type: [String], index: true },
        photo: String,
        likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        comments: { type: [commentSchema], default: [] }
    },
    { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ title: "text", message: "text", tags: "text" });

export default mongoose.models.Post || mongoose.model("Post", postSchema);
