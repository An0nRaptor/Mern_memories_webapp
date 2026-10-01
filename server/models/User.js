import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 60 },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        bio: { type: String, default: "", maxlength: 160 }
    },
    { timestamps: true }
);

userSchema.methods.toPublic = function () {
    return { id: this._id, name: this.name, email: this.email, bio: this.bio, createdAt: this.createdAt };
};

export default mongoose.models.User || mongoose.model("User", userSchema);
