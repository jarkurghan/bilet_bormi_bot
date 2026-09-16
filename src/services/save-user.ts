import { eq } from "drizzle-orm/sql/expressions/conditions";
import { ADMIN_CHAT } from "../utils/constants";
import { CTX, SaveUserData, UserRow, UserStatus } from "../utils/types";
import { sendErrorLog } from "./log";
import { users } from "../db/schema";
import { bot } from "../bot";
import { db } from "../db";

type UserInsert = typeof users.$inferInsert;

export function userLink(user: { tg_id: string | number; first_name?: string | null; last_name?: string | null; username?: string | null }): string {
    const fullName = `${user.first_name || "Noma'lum"} ${user.last_name || ""}`.trim();
    return user.username ? `<a href="tg://resolve?domain=${user.username}">${fullName}</a>` : `<a href="tg://user?id=${user.tg_id}">${fullName}</a>`;
}

export function groupLink(chat: { id: number | string; title?: string | null; username?: string | null }): string {
    const name = chat.title || "Noma'lum";
    return chat.username ? `<a href="https://t.me/${chat.username}">${name}</a>` : name;
}

async function botHandle(): Promise<string> {
    try {
        const me = await bot.api.getMe();
        return me.username ? `@${me.username}` : "bilet_bormi_bot";
    } catch {
        return "bilet_bormi_bot";
    }
}

export async function saveUser(ctx: CTX, data?: SaveUserData): Promise<UserRow[]> {
    const user = ctx.from;
    if (!user) return [];

    const userData: UserInsert = {
        tg_id: String(user.id),
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
    };

    if (data?.status) userData.status = data.status;
    if (data?.utm) userData.utm = data.utm;

    try {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.tg_id, String(user.id)))
            .limit(1);

        if (!existingUser) {
            const utm = data?.utm || "Xudo biladi 🤷‍♂️";
            const username = user.username ? `@${user.username}` : "Noma'lum";
            const handle = await botHandle();
            const msg =
                `🆕 Yangi foydalanuvchi:\n\n👤 Ism: ${userLink({ tg_id: user.id, first_name: user.first_name, last_name: user.last_name, username: user.username })}\n🔗 Username: ${username}\n` +
                `🆔 ID: <code>${user.id}</code>\n🚪 Qayerdan kelgan: ${utm}\n🤖 Bot: ${handle}`;
            await bot.api.sendMessage(ADMIN_CHAT, msg, { parse_mode: "HTML" });
            if (!userData.status) userData.status = "new";
        } else {
            if (!userData.status) userData.status = existingUser.status as UserStatus;
            if (!userData.utm) userData.utm = existingUser.utm;
        }

        const upserted = await db
            .insert(users)
            .values(userData)
            .onConflictDoUpdate({ target: users.tg_id, set: userData })
            .returning();

        return upserted;
    } catch (error) {
        await sendErrorLog({ event: "User saqlashda", error, ctx });
        return [];
    }
}

export async function getUserByTgId(tgId: string | number): Promise<UserRow | undefined> {
    const [row] = await db.select().from(users).where(eq(users.tg_id, String(tgId))).limit(1);
    return row;
}
