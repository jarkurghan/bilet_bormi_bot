import { BOT_TOKEN } from "./utils/constants";
import { Bot, webhookCallback } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { registerStartCommand } from "./handlers/register-start-command";
import { registerErrorHandler } from "./handlers/register-error-handler";
import { onMyChatMember } from "./handlers/on-my-chat-member";
import { registerLangCallback, registerLanguageCallback } from "./handlers/select-lang-callback";
import { registerDashboardCallback } from "./handlers/register-dashboard-callback";
import { registerPremiumCallback, registerPremiumRequestCallback, registerPremiumRequestConfirmCallback } from "./handlers/register-premium-callback";
import { registerAdminPremiumCallback } from "./handlers/admin-premium-callback";
import { registerSettingsCallback } from "./handlers/register-settings-callback";
import { registerFrequencyMenuCallback, registerFrequencySelectCallback } from "./handlers/select-frequency-callback";
import { registerRoutesCallback } from "./handlers/register-routes-callback";
import { registerAddRouteCallback, registerCancelRouteCallback, registerTransportCallback, registerWizardNoopCallback } from "./handlers/add-route-callback";
import { registerCalendarDateCallback, registerCalendarMonthCallback, registerWizardBackCallback } from "./handlers/select-date-callback";
import { registerRegionCallback, registerStationCallback, registerStationPageCallback } from "./handlers/select-station-callback";
import { registerConfirmRouteCallback } from "./handlers/confirm-route-callback";
import { registerDeleteRouteCallback, registerViewRouteCallback } from "./handlers/delete-route-callback";
import { BTN } from "./services/messages";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN topilmadi!");
export const bot = new Bot(BOT_TOKEN);

bot.api.config.use(autoRetry());

bot.command("start", registerStartCommand);
bot.callbackQuery(/^lang_(1|2)$/, registerLangCallback);
bot.callbackQuery(/^language$/, registerLanguageCallback);
bot.callbackQuery(/^dashboard$/, registerDashboardCallback);
bot.callbackQuery(/^premium$/, registerPremiumCallback);
bot.callbackQuery(/^prem_req$/, registerPremiumRequestCallback);
bot.callbackQuery(/^prem_req_ok$/, registerPremiumRequestConfirmCallback);
bot.callbackQuery(/^prem_(ok|no)_\d+$/, registerAdminPremiumCallback);
bot.callbackQuery(/^settings$/, registerSettingsCallback);
bot.callbackQuery(/^freq$/, registerFrequencyMenuCallback);
bot.callbackQuery(/^freq_(1|3|6)$/, registerFrequencySelectCallback);
bot.callbackQuery(/^routes$/, registerRoutesCallback);
bot.callbackQuery(/^rt_add$/, registerAddRouteCallback);
bot.callbackQuery(/^rt_tr_(train|bus)$/, registerTransportCallback);
bot.callbackQuery(/^rt_x$/, registerCancelRouteCallback);
bot.callbackQuery(/^(rt_noop|noop)$/, registerWizardNoopCallback);
bot.callbackQuery(/^rt_m_\d{6}$/, registerCalendarMonthCallback);
bot.callbackQuery(/^rt_d_\d{8}$/, registerCalendarDateCallback);
bot.callbackQuery(/^rt_back_/, registerWizardBackCallback);
bot.callbackQuery(/^rt_r_/, registerRegionCallback);
bot.callbackQuery(/^rt_pg_\d+$/, registerStationPageCallback);
bot.callbackQuery(/^rt_s_\d+$/, registerStationCallback);
bot.callbackQuery(/^rt_ok$/, registerConfirmRouteCallback);
bot.callbackQuery(/^rt_del_\d+$/, registerDeleteRouteCallback);
bot.callbackQuery(/^rt_v_\d+$/, registerViewRouteCallback);

bot.hears([BTN.ROUTES[1], BTN.ROUTES[2]], registerRoutesCallback);
bot.hears([BTN.ADD_ROUTE[1], BTN.ADD_ROUTE[2]], registerAddRouteCallback);
bot.hears([BTN.SETTINGS[1], BTN.SETTINGS[2]], registerSettingsCallback);
bot.hears([BTN.PREMIUM[1], BTN.PREMIUM[2]], registerPremiumCallback);

bot.on("my_chat_member", onMyChatMember);
bot.catch(registerErrorHandler);

export const handleUpdate = webhookCallback(bot, "hono");
