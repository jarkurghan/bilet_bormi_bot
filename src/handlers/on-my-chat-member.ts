import { Context, Filter } from "grammy";
import { saveUser } from "../services/save-user";
import { saveChat, getChatByTgId } from "../services/save-chat";
import { sendErrorLog } from "../services/log";
import { changeChatStatus, changeUserStatus } from "../services/deactivator";
import { MESSAGES } from "../services/messages";
import { langKeyboard, makeDashboardReplyKeyboard, premiumKeyboard } from "../services/make-keyboard";
import { chatIsPremium } from "../services/premium";
import { langOf } from "../services/messages";

export async function onMyChatMember(ctx: Filter<Context, "my_chat_member">) {
    try {
        const status = ctx.myChatMember.new_chat_member.status;
        const chat = ctx.chat;

        if (chat.type === "private") {
            await saveUser(ctx);
            if (status === "kicked") {
                await changeUserStatus(ctx, "has_blocked");
            } else if (status === "member") {
                await changeUserStatus(ctx, "active");
            }
            return;
        }

        if (chat.type !== "group" && chat.type !== "supergroup") return;

        if (status === "kicked" || status === "left") {
            const existing = await getChatByTgId(chat.id);
            if (existing) await changeChatStatus(existing.id, status === "kicked" ? "kicked" : "left", ctx);
            return;
        }

        if (status === "member" || status === "administrator") {
            const [saved] = await saveChat(ctx, { status: "active" });
            await saveUser(ctx);
            if (!saved) return;

            if (!saved.language) {
                await ctx.reply(MESSAGES.SELECT_LANG[1], langKeyboard());
                return;
            }

            const lang = langOf(saved);
            const isPremium = chatIsPremium(saved);
            await ctx.reply(isPremium ? MESSAGES.DASHBOARD(saved) : MESSAGES.PREMIUM_LOCKED[lang], {
                parse_mode: "HTML",
                reply_markup: makeDashboardReplyKeyboard(lang, isPremium),
            });
            if (!isPremium) {
                await ctx.reply(MESSAGES.PREMIUM_PAGE[lang], premiumKeyboard(lang, false));
            }
        }
    } catch (error) {
        await sendErrorLog({ event: "Chat a'zolik o'zgarganda", error, ctx });
    }
}
