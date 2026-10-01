import mongoose from "mongoose";

// Serverless functions are re-invoked in the same container while it's warm,
// so the connection is cached on the module and reused across requests.
let connecting = null;

export function connectDB() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) {
        const uri = process.env.MONGO_URL;
        if (!uri) throw new Error("MONGO_URL is not set");
        connecting = mongoose
            .connect(uri, {
                dbName: process.env.MONGO_DB || "memories",
                serverSelectionTimeoutMS: 8000
            })
            .catch(err => {
                connecting = null; // let the next request retry
                throw err;
            });
    }
    return connecting;
}

export function photoBucket() {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "photos"
    });
}
