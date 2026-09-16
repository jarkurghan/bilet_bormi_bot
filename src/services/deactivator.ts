import { eq } from "drizzle-orm/sql/expressions/conditions";
import { users } from "../db/schema";
import { db } from "../db";
import { sendAdmin, sendErrorLog, sendLog } from "./log";
import { ChatStatus, CTX, UserStatus } from "../utils/types";
import { userLink } from "./save-user";
import { updateChatById } from "./save-chat";
import { bot } from "../bot";

async function botHandle(): Promise<string> {
    try {
        const me = await bot.api.getMe();
        return me.username ? `@${me.username}` : "bilet_bormi_bot";
    } catch {
        return "bilet_bormi_bot";
    }
}

export async function changeUserStatus(ctx: CTX, status: UserStatus): Promise<void> {
    const tg_id = ctx.from?.id;
    if (!tg_id) return;

    const user = { tg_id, first_name: ctx.from?.first_name || "", last_name: ctx.from?.last_name || "", username: ctx.from?.username || "" };
    const userlink = userLink(user);

    try {
        const [updated] = await db.update(users).set({ status }).where(eq(users.tg_id, String(tg_id))).returning();

        if (!updated) {
            await sendLog(
                `❗️ <b>Xato:</b>\n\n🔦 Tafsilot: Status o'zgartirilmadi (foydalanuvchi topilmadi)\n🆔 User ID: <code>${tg_id}</code>\n👤 User: ${userlink}`,
            );
        } else {
            const handle = await botHandle();
            await sendAdmin(
                `♻️ Status o'zgartirildi:\n\n👤 Ism: ${userlink}\n🆔 User ID: <code>${tg_id}</code>\n🔦 Yangi status: ${status}\n🤖 Bot: ${handle}`,
            );
        }
    } catch (error) {
        await sendErrorLog({ event: "Status o'zgartirish jarayonida", error, ctx });
    }
}

export async function changeChatStatus(chatId: number, status: ChatStatus, ctx?: CTX): Promise<void> {
    try {
        const updated = await updateChatById(chatId, { status });
        if (!updated) {
            await sendLog(`❗️ Chat status o'zgartirilmadi (topilmadi): ${chatId}`);
        }
    } catch (error) {
        await sendErrorLog({ event: "Chat status o'zgartirishda", error, ctx });
    }
}

export async function markBlockedByTgId(tgId: string | number, status: UserStatus): Promise<void> {
    try {
        await db.update(users).set({ status }).where(eq(users.tg_id, String(tgId)));
    } catch (error) {
        await sendErrorLog({ event: "Blok statusini yozishda", error });
    }
}
