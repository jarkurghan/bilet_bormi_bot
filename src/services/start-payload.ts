import type { Context } from "grammy";

export function getStartPayload(ctx: Context): string {
    const text = ctx.message?.text;
    if (!text?.startsWith("/start")) return "";
    const m = text.match(/^\/start(?:\s+(.+))?$/s);
    return m?.[1]?.trim() || "";
}

export function objPayload(payload: string): { [key: string]: string } {
    const arr = payload.toLowerCase().split("--");

    const obj: { [key: string]: string } = {};
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i].split("-");
        if (item.length > 1) obj[item[0]] = item.slice(1).join("-");
        else {
            const underscored = arr[i].split("_");
            if (underscored.length > 1) obj[underscored[0]] = underscored.slice(1).join("_");
        }
    }

    return obj;
}

export function findUtm(obj: { [key: string]: string }): string {
    if (obj.mcode) return obj.mcode;
    if (obj.utm) return obj.utm;
    return "";
}
