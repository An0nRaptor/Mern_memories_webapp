import serverless from "serverless-http";
import app from "../../server/app.js";

const handle = serverless(app, {
    // Photo responses are binary and must go back base64-encoded.
    binary: ["image/*"]
});

export const handler = async (event, context) => {
    // Keep the warm MongoDB connection open instead of waiting for it to close.
    context.callbackWaitsForEmptyEventLoop = false;
    return handle(event, context);
};
