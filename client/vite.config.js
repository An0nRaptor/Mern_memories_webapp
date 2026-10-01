import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        // In development the API runs separately (npm run dev:server).
        proxy: { "/api": "http://localhost:4000" }
    }
});
