import { ParseMode } from "@grammyjs/types";
import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { chats, users } from "../db/schema";

export type Lang = 1 | 2;
export type Transport = "train" | "bus";
export type ChatType = "private" | "group" | "supergroup";
export type UserStatus = "new" | "active" | "has_blocked" | "deleted_account" | "other";
export type ChatStatus = "active" | "inactive" | "kicked" | "left";
export type Frequency = 6 | 3 | 1;

export type CTX = CommandContext<Context> | CallbackQueryContext<Context> | Context;

export type LogOptions = { parse_mode?: ParseMode; reply_to_message_id?: number };
export type ErrorLogOptions = { ctx?: Context; event: string; error: unknown; reply_to_message_id?: number; parse_mode?: ParseMode };

export type UserRow = typeof users.$inferSelect;
export type ChatRow = typeof chats.$inferSelect;

export type SaveUserData = {
    status?: UserStatus;
    utm?: string;
};

export type SaveChatData = {
    language?: number;
    frequency?: number;
    premium_until?: Date | null;
    status?: ChatStatus;
    title?: string;
};

export type Station = {
    id: number;
    code: string;
    name_latin: string;
    name_cyrillic: string;
    region_code: string | null;
    region_latin: string | null;
    region_cyrillic: string | null;
};

export type Region = {
    region_code: string;
    region_latin: string;
    region_cyrillic: string;
};

export type WizardStep = "type" | "date" | "from_region" | "from" | "to_region" | "to" | "confirm";
