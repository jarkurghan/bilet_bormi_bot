import { and, eq, lt } from "drizzle-orm";
import { chats, routes, ticketSnapshots } from "../db/schema";
import { db, sql } from "../db";
import { bot } from "../bot";
import { sendErrorLog, sendLog } from "../services/log";
import { fetchTrains, trainsHaveTickets } from "../services/train-api";
import { fetchBuses, busesHaveTickets } from "../services/bus-api";
import { formatTicketMessage } from "../services/format-tickets";
import { isPremiumUntil, shouldNotify, tashkentParts, todayISO } from "../utils/date";
import { markBlockedByTgId } from "../services/deactivator";
import { ChatRow } from "../utils/types";

type RouteRow = typeof routes.$inferSelect;

function snapshotKey(transport: string, date: string, from: string, to: string): string {
    return `${transport}|${date}|${from}|${to}`;
}

function splitMessage(text: string, max = 3500): string[] {
    if (text.length <= max) return [text];
    const parts: string[] = [];
    let rest = text;
    while (rest.length > max) {
        let cut = rest.lastIndexOf("\n\n", max);
        if (cut < max / 3) cut = rest.lastIndexOf("\n", max);
        if (cut < max / 3) cut = max;
        parts.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
    return parts;
}

async function sendToChat(chatId: string, text: string): Promise<"ok" | "blocked" | "deleted" | "error"> {
    try {
        for (const part of splitMessage(text)) {
            await bot.api.sendMessage(chatId, part, { parse_mode: "HTML" });
        }
        return "ok";
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("bot was blocked by the user")) return "blocked";
        if (message.includes("user is deactivated") || message.includes("chat not found")) return "deleted";
        await sendErrorLog({ event: "Ticket xabar yuborishda", error });
        return "error";
    }
}

async function fetchSnapshot(route: Pick<RouteRow, "transport" | "travel_date" | "from_code" | "to_code">) {
    if (route.transport === "train") {
        const payload = await fetchTrains({
            date: route.travel_date,
            depStationCode: route.from_code,
            arvStationCode: route.to_code,
        });
        return { payload, hasTickets: trainsHaveTickets(payload) };
    }
    const payload = await fetchBuses({
        date: route.travel_date,
        from: route.from_code,
        to: route.to_code,
    });
    return { payload, hasTickets: busesHaveTickets(payload) };
}

async function upsertSnapshot(route: RouteRow, payload: unknown, hasTickets: boolean, updatedAt: Date) {
    await db
        .insert(ticketSnapshots)
        .values({
            transport: route.transport,
            travel_date: route.travel_date,
            from_code: route.from_code,
            to_code: route.to_code,
            payload,
            has_tickets: hasTickets,
            updated_at: updatedAt,
        })
        .onConflictDoUpdate({
            target: [ticketSnapshots.transport, ticketSnapshots.travel_date, ticketSnapshots.from_code, ticketSnapshots.to_code],
            set: { payload, has_tickets: hasTickets, updated_at: updatedAt },
        });
}

async function main() {
    const today = todayISO();
    const parts = tashkentParts();

    await db.update(routes).set({ is_active: false }).where(and(eq(routes.is_active, true), lt(routes.travel_date, today)));

    const rows = await db
        .select({ route: routes, chat: chats })
        .from(routes)
        .innerJoin(chats, eq(routes.chat_id, chats.id))
        .where(and(eq(routes.is_active, true), eq(chats.status, "active")));

    const unique = new Map<string, RouteRow>();
    for (const row of rows) {
        const key = snapshotKey(row.route.transport, row.route.travel_date, row.route.from_code, row.route.to_code);
        if (!unique.has(key)) unique.set(key, row.route);
    }

    const fetchedAt = new Date();
    const okKeys = new Set<string>();
    const payloads = new Map<string, { payload: unknown; hasTickets: boolean }>();

    for (const route of unique.values()) {
        const key = snapshotKey(route.transport, route.travel_date, route.from_code, route.to_code);
        try {
            const result = await fetchSnapshot(route);
            await upsertSnapshot(route, result.payload, result.hasTickets, fetchedAt);
            okKeys.add(key);
            payloads.set(key, result);
        } catch (error) {
            await sendErrorLog({
                event: `Ticket API (${route.transport} ${route.travel_date} ${route.from_code}->${route.to_code})`,
                error,
            });
        }
    }

    let sent = 0;
    for (const row of rows) {
        const chat = row.chat as ChatRow;
        if (!isPremiumUntil(chat.premium_until)) continue;
        if (!shouldNotify(chat.frequency || 6, parts.minute)) continue;

        const key = snapshotKey(row.route.transport, row.route.travel_date, row.route.from_code, row.route.to_code);
        if (!okKeys.has(key)) continue;
        const fresh = payloads.get(key);
        if (!fresh) continue;

        const text = formatTicketMessage({
            chat,
            route: row.route,
            payload: fresh.payload,
            updatedAt: fetchedAt,
        });

        const result = await sendToChat(String(chat.tg_chat_id), text);
        if (result === "ok") sent += 1;
        if (result === "blocked" && chat.type === "private") {
            await markBlockedByTgId(String(chat.tg_chat_id), "has_blocked");
            await db.update(chats).set({ status: "kicked" }).where(eq(chats.id, chat.id));
        }
        if (result === "deleted" && chat.type === "private") {
            await markBlockedByTgId(String(chat.tg_chat_id), "deleted_account");
            await db.update(chats).set({ status: "left" }).where(eq(chats.id, chat.id));
        }
    }

    await sendLog(`🎫 Scheduler: ${unique.size} yo'nalish, ${okKeys.size} muvaffaqiyatli API, ${sent} xabar. ${parts.date} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`);
}

main()
    .catch(async (error) => {
        await sendErrorLog({ event: "Scheduler asosiy jarayonida", error });
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end({ timeout: 5 });
    });
