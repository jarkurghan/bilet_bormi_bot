export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const ADMIN_CHAT = process.env.ADMIN_CHAT_ID || "";
export const LOG_CHAT = process.env.LOG_CHAT_ID || "";
export const ADMIN_ID = process.env.ADMIN_PRIVATE_CHAT_ID || "";
export const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "").replace(/^@/, "");
export const MAX_ROUTES_PER_CHAT = process.env.MAX_ROUTES_PER_CHAT ? Number(process.env.MAX_ROUTES_PER_CHAT) : 10;

export const PREMIUM_PRIVATE_PRICE = 39000;
export const PREMIUM_GROUP_PRICE = 99000;
export const PREMIUM_DAYS = 30;
export const STATIONS_PER_PAGE = 8;
export const TZ = "Asia/Tashkent";
