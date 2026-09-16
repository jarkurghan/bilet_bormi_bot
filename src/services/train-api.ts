export async function fetchTrains(opts: { date: string; depStationCode: string; arvStationCode: string }): Promise<unknown> {
    const res = await fetch("https://eticket.uzrailpass.uz/api/v3/handbook/trains/list", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Language": "uz",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0",
            Referer: "https://eticket.uzrailpass.uz/uz/pages/trains-page",
            Origin: "https://eticket.uzrailpass.uz",
            "device-type": "BROWSER",
        },
        body: JSON.stringify({
            directions: {
                forward: {
                    date: opts.date,
                    depStationCode: opts.depStationCode,
                    arvStationCode: opts.arvStationCode,
                },
            },
            routeType: "INTERCITY",
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Train API ${res.status}: ${text.slice(0, 300)}`);
    }

    return res.json();
}

export function trainsHaveTickets(payload: unknown): boolean {
    const trains = extractTrains(payload);
    return trains.some((train) => trainHasSeats(train));
}

export function extractTrains(payload: unknown): Record<string, unknown>[] {
    if (!payload || typeof payload !== "object") return [];
    const root = payload as Record<string, unknown>;
    const data = (root.data as Record<string, unknown> | undefined) || root;
    const directions = data.directions as Record<string, unknown> | undefined;
    const forward = directions?.forward as Record<string, unknown> | undefined;
    const trains = forward?.trains;
    return Array.isArray(trains) ? (trains as Record<string, unknown>[]) : [];
}

function trainHasSeats(train: Record<string, unknown>): boolean {
    const cars = Array.isArray(train.cars) ? (train.cars as Record<string, unknown>[]) : [];
    if (!cars.length) {
        const free = Number(train.freeSeats ?? train.free_seats ?? 0);
        return free > 0;
    }
    return cars.some((car) => Number(car.freeSeats ?? car.free_seats ?? 0) > 0);
}
