import { CTX, ChatRow, UserRow } from "../utils/types";
import { saveUser } from "./save-user";
import { saveChat } from "./save-chat";
import { langKeyboard, makeDashboardReplyKeyboard, premiumKeyboard } from "./make-keyboard";
import { MESSAGES, langOf } from "./messages";
import { chatIsPremium } from "./premium";

export type Flow = { user: UserRow; chat: ChatRow; lang: 1 | 2; isPremium: boolean };

export async function loadFlow(ctx: CTX): Promise<Flow | null> {
    const [user] = await saveUser(ctx);
    const [chat] = await saveChat(ctx);
    if (!user || !chat) return null;
    const lang = langOf(chat);
    return { user, chat, lang, isPremium: chatIsPremium(chat) };
}

export async function requireLang(ctx: CTX): Promise<Flow | null> {
    const flow = await loadFlow(ctx);
    if (!flow) return null;
    if (!flow.chat.language) {
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.SELECT_LANG[1], langKeyboard());
        return null;
    }
    return flow;
}

export async function requirePremium(ctx: CTX, flow: Flow): Promise<boolean> {
    if (flow.isPremium) return true;
    if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
    await ctx.reply(MESSAGES.PREMIUM_LOCKED[flow.lang], { reply_markup: makeDashboardReplyKeyboard(flow.lang, false) });
    await ctx.reply(MESSAGES.PREMIUM_PAGE[flow.lang], premiumKeyboard(flow.lang, false));
    if (ctx.callbackQuery) await ctx.answerCallbackQuery().catch(() => undefined);
    return false;
}

export async function showDashboard(ctx: CTX, flow: Flow, deletePrev = true) {
    if (deletePrev && ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
    const keyboard = makeDashboardReplyKeyboard(flow.lang, flow.isPremium);
    await ctx.reply(MESSAGES.DASHBOARD(flow.chat), { parse_mode: "HTML", reply_markup: keyboard });
}

export async function answerCb(ctx: CTX, text?: string) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text }).catch(() => undefined);
}
