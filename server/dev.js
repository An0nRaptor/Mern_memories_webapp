// Local API server: `npm run dev:server` (the Vite dev server proxies /api here).
import "dotenv/config";
import app from "./app.js";

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Memories API on http://localhost:${port}`));
