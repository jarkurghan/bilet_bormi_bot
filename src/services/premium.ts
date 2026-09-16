import { and, eq } from "drizzle-orm";
import { chats, premiumRequests } from "../db/schema";
import { db } from "../db";
import { bot } from "../bot";
import { ADMIN_CHAT, PREMIUM_DAYS, PREMIUM_GROUP_PRICE, PREMIUM_PRIVATE_PRICE } from "../utils/constants";
import { ChatRow } from "../utils/types";
import { extendPremium, formatSom, isPremiumUntil } from "../utils/date";
import { groupLink, userLink } from "./save-user";
import { adminPremiumKeyboard } from "./make-keyboard";
import { sendErrorLog } from "./log";
import { updateChatById } from "./save-chat";
import { InlineKeyboard } from "grammy";

export function chatIsPremium(chat: ChatRow | undefined | null): boolean {
    return Boolean(chat && isPremiumUntil(chat.premium_until));
}

export function planForChat(chat: ChatRow): { plan: "private" | "group"; price: number } {
    if (chat.type === "private") return { plan: "private", price: PREMIUM_PRIVATE_PRICE };
    return { plan: "group", price: PREMIUM_GROUP_PRICE };
}

export async function getPendingRequest(chatId: number) {
    const [row] = await db
        .select()
        .from(premiumRequests)
        .where(and(eq(premiumRequests.chat_id, chatId), eq(premiumRequests.status, "pending")))
        .limit(1);
    return row;
}

export async function createPremiumRequest(chat: ChatRow, requestedByTgId: string | number) {
    const existing = await getPendingRequest(chat.id);
    if (existing) return { request: existing, created: false as const };

    const { plan, price } = planForChat(chat);
    const [request] = await db
        .insert(premiumRequests)
        .values({
            chat_id: chat.id,
            requested_by_tg_id: String(requestedByTgId),
            plan,
            price,
        })
        .returning();

    return { request, created: true as const };
}

export async function sendPremiumRequestToAdmin(opts: {
    chat: ChatRow;
    requestId: number;
    from: { id: number; first_name: string; last_name?: string; username?: string };
}) {
    const { chat, requestId, from } = opts;
    const { plan, price } = planForChat(chat);
    const handle = await botHandle();
    const planLabel = plan === "private" ? "Private chat" : "Guruh";
    const who = userLink({ tg_id: from.id, first_name: from.first_name, last_name: from.last_name, username: from.username });
    const chatTitle =
        chat.type === "private"
            ? who
            : groupLink({ id: chat.tg_chat_id || "", title: chat.title, username: null });

    const msg =
        `⭐ Premium so'rov\n\n` +
        `📦 Plan: <b>${planLabel}</b>\n` +
        `💰 Narx: <b>${formatSom(price)} so'm</b> / oy\n` +
        `💬 Chat: ${chatTitle}\n` +
        `🆔 Chat ID: <code>${chat.tg_chat_id}</code>\n` +
        `👤 So'rovchi: ${who}\n` +
        `🔗 Username: ${from.username ? `@${from.username}` : "Noma'lum"}\n` +
        `🤖 Bot: ${handle}`;

    const sent = await bot.api.sendMessage(ADMIN_CHAT, msg, {
        parse_mode: "HTML",
        reply_markup: adminPremiumKeyboard(requestId),
    });

    await db.update(premiumRequests).set({ admin_message_id: sent.message_id }).where(eq(premiumRequests.id, requestId));
    return sent;
}

export async function resolvePremiumRequest(requestId: number, action: "approved" | "rejected") {
    const [request] = await db.select().from(premiumRequests).where(eq(premiumRequests.id, requestId)).limit(1);
    if (!request) return null;
    if (request.status !== "pending") return { request, chat: await getChatRow(request.chat_id), already: true as const };

    const [chat] = await db.select().from(chats).where(eq(chats.id, request.chat_id)).limit(1);
    if (!chat) return null;

    if (action === "approved") {
        const premium_until = extendPremium(chat.premium_until, PREMIUM_DAYS);
        await updateChatById(chat.id, { premium_until, status: "active" });
        chat.premium_until = premium_until;
    }

    const [updated] = await db
        .update(premiumRequests)
        .set({ status: action, resolved_at: new Date() })
        .where(eq(premiumRequests.id, requestId))
        .returning();

    return { request: updated, chat, already: false as const };
}

export async function markAdminRequestResolved(requestId: number, action: "approved" | "rejected") {
    try {
        const [request] = await db.select().from(premiumRequests).where(eq(premiumRequests.id, requestId)).limit(1);
        if (!request?.admin_message_id) return;
        const text = action === "approved" ? "✅ Tasdiqlandi" : "❌ Rad etildi";
        await bot.api.editMessageReplyMarkup(ADMIN_CHAT, request.admin_message_id, {
            reply_markup: new InlineKeyboard().text(text, "noop"),
        });
    } catch (error) {
        await sendErrorLog({ event: "Admin premium tugmasini yangilashda", error });
    }
}

async function getChatRow(id: number) {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return chat;
}

async function botHandle(): Promise<string> {
    try {
        const me = await bot.api.getMe();
        return me.username ? `@${me.username}` : "bilet_bormi_bot";
    } catch {
        return "bilet_bormi_bot";
    }
}
