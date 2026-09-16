import { eq } from "drizzle-orm/sql/expressions/conditions";
import { ADMIN_CHAT } from "../utils/constants";
import { ChatRow, ChatStatus, ChatType, CTX, SaveChatData } from "../utils/types";
import { sendErrorLog } from "./log";
import { chats } from "../db/schema";
import { bot } from "../bot";
import { db } from "../db";
import { groupLink, userLink } from "./save-user";

type ChatInsert = typeof chats.$inferInsert;

async function botHandle(): Promise<string> {
    try {
        const me = await bot.api.getMe();
        return me.username ? `@${me.username}` : "bilet_bormi_bot";
    } catch {
        return "bilet_bormi_bot";
    }
}

function chatTitle(ctx: CTX): string {
    const chat = ctx.chat;
    if (!chat) return "";
    if (chat.type === "private") {
        const from = ctx.from;
        return `${from?.first_name || ""} ${from?.last_name || ""}`.trim();
    }
    if ("title" in chat) return chat.title || "";
    return "";
}

function chatType(ctx: CTX): ChatType | null {
    const type = ctx.chat?.type;
    if (type === "private" || type === "group" || type === "supergroup") return type;
    return null;
}

export async function saveChat(ctx: CTX, data?: SaveChatData): Promise<ChatRow[]> {
    const chat = ctx.chat;
    if (!chat) return [];

    const type = chatType(ctx);
    if (!type) return [];

    const chatData: ChatInsert = {
        tg_chat_id: String(chat.id),
        type,
        title: data?.title ?? chatTitle(ctx),
        added_by_tg_id: ctx.from ? String(ctx.from.id) : null,
    };

    if (typeof data?.language === "number") chatData.language = data.language;
    if (typeof data?.frequency === "number") chatData.frequency = data.frequency;
    if (data && "premium_until" in data) chatData.premium_until = data.premium_until ?? null;
    if (data?.status) chatData.status = data.status;

    try {
        const [existing] = await db
            .select()
            .from(chats)
            .where(eq(chats.tg_chat_id, String(chat.id)))
            .limit(1);

        if (!existing) {
            if (type !== "private") {
                const handle = await botHandle();
                const from = ctx.from;
                const adder = from
                    ? userLink({ tg_id: from.id, first_name: from.first_name, last_name: from.last_name, username: from.username })
                    : "Noma'lum";
                const username = from?.username ? `@${from.username}` : "Noma'lum";
                const msg =
                    `🆕 Yangi guruh:\n\n📢 Guruh: ${groupLink({ id: chat.id, title: chatData.title, username: "username" in chat ? chat.username : null })}\n` +
                    `🆔 Chat ID: <code>${chat.id}</code>\n` +
                    `👤 Qo'shgan: ${adder}\n🔗 Username: ${username}\n🤖 Bot: ${handle}`;
                await bot.api.sendMessage(ADMIN_CHAT, msg, { parse_mode: "HTML" });
            }
            if (!chatData.status) chatData.status = "active";
        } else {
            if (typeof chatData.language !== "number") chatData.language = existing.language;
            if (typeof chatData.frequency !== "number") chatData.frequency = existing.frequency;
            if (!("premium_until" in (data || {}))) chatData.premium_until = existing.premium_until;
            if (!chatData.status) chatData.status = existing.status as ChatStatus;
            if (!chatData.title) chatData.title = existing.title;
        }

        const upserted = await db
            .insert(chats)
            .values(chatData)
            .onConflictDoUpdate({ target: chats.tg_chat_id, set: chatData })
            .returning();

        return upserted;
    } catch (error) {
        await sendErrorLog({ event: "Chat saqlashda", error, ctx });
        return [];
    }
}

export async function getChatById(id: number): Promise<ChatRow | undefined> {
    const [row] = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return row;
}

export async function getChatByTgId(tgChatId: string | number): Promise<ChatRow | undefined> {
    const [row] = await db.select().from(chats).where(eq(chats.tg_chat_id, String(tgChatId))).limit(1);
    return row;
}

export async function updateChatById(id: number, data: Partial<ChatInsert>): Promise<ChatRow | undefined> {
    const [row] = await db.update(chats).set(data).where(eq(chats.id, id)).returning();
    return row;
}
