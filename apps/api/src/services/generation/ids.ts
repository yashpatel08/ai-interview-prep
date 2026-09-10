import crypto from "node:crypto";

export function createStableId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
}