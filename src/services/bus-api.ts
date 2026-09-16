export async function fetchBuses(opts: { date: string; from: string; to: string }): Promise<unknown> {
    const res = await fetch("https://wapi.avtoticket.uz/api/api-trips", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Language": "uz",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0",
            Referer: "https://avtoticket.uz/",
            Origin: "https://avtoticket.uz",
        },
        body: JSON.stringify({
            date: opts.date,
            from: opts.from,
            to: opts.to,
            days: 1,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Bus API ${res.status}: ${text.slice(0, 300)}`);
    }

    return res.json();
}

export function busesHaveTickets(payload: unknown): boolean {
    return extractTrips(payload).some((trip) => tripFreeSeats(trip) > 0);
}

export function extractTrips(payload: unknown): Record<string, unknown>[] {
    if (!payload || typeof payload !== "object") return [];
    const root = payload as Record<string, unknown>;
    const candidates = [root.trips, root.data, root.items, root.result, root.trips_list];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
        if (candidate && typeof candidate === "object") {
            const nested = candidate as Record<string, unknown>;
            for (const key of ["trips", "data", "items", "list"]) {
                if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
            }
        }
    }
    if (Array.isArray(payload)) return payload as Record<string, unknown>[];
    return [];
}

export function tripFreeSeats(trip: Record<string, unknown>): number {
    const seats = Number(trip.seats ?? trip.free_seats ?? trip.freeSeats ?? trip.available_seats ?? 0);
    const sold = Number(trip.sold_seats ?? trip.soldSeats ?? 0);
    if (trip.seats != null && trip.sold_seats != null) return Math.max(0, seats - sold);
    if (trip.free_seats != null || trip.freeSeats != null || trip.available_seats != null) return seats;
    if (typeof trip.seats === "number") return seats;
    return 0;
}
