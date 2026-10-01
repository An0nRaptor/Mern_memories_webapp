const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
];

export function timeAgo(date) {
    const seconds = (new Date(date) - Date.now()) / 1000;
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return "just now";
}

export const fullDate = date =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

// Stable avatar colour per name.
const AVATAR_COLORS = ["#5b4cdb", "#e2557a", "#0f9d8a", "#e08a1e", "#3477e0", "#9b4dca", "#d1495b", "#2a9d8f"];
export function avatarColor(name = "") {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
export const initials = (name = "?") =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";

// Shrink photos before upload: keeps requests small and pages fast.
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
}
