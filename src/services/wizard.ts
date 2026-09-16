import { eq } from "drizzle-orm";
import { routeWizards } from "../db/schema";
import { db } from "../db";
import { Transport } from "../utils/types";

export type WizardRow = typeof routeWizards.$inferSelect;
type WizardInsert = typeof routeWizards.$inferInsert;

export async function getWizard(chatId: number): Promise<WizardRow | undefined> {
    const [row] = await db.select().from(routeWizards).where(eq(routeWizards.chat_id, chatId)).limit(1);
    return row;
}

export async function upsertWizard(chatId: number, data: Partial<WizardInsert> & { step: string }): Promise<WizardRow> {
    const values: WizardInsert = { chat_id: chatId, ...data };
    const [row] = await db
        .insert(routeWizards)
        .values(values)
        .onConflictDoUpdate({ target: routeWizards.chat_id, set: data })
        .returning();
    return row;
}

export async function clearWizard(chatId: number): Promise<void> {
    await db.delete(routeWizards).where(eq(routeWizards.chat_id, chatId));
}

export function wizardTransport(wizard: WizardRow | undefined): Transport | null {
    if (wizard?.transport === "train" || wizard?.transport === "bus") return wizard.transport;
    return null;
}
