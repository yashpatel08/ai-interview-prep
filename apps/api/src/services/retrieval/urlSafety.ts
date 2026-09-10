import dns from "node:dns/promises";
import net from "node:net";

import { env } from "../../config/env.js";

function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split(".").map(Number);

    if (parts.length !== 4 || parts.some(Number.isNaN)) {
        return false;
    }

    const [a, b] = parts;

    if (a === 10) {
        return true;
    }

    if (a === 127) {
        return true;
    }

    if (a === 169 && b === 254) {
        return true;
    }

    if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
        return true;
    }

    if (a === 192 && b === 168) {
        return true;
    }

    return false;
}

function isPrivateIPv6(ip: string): boolean {
    const normalized = ip.toLowerCase();

    return (
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:")
    );
}

function isBlockedHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase();

    return (
        normalized === "localhost" ||
        normalized.endsWith(".localhost") ||
        normalized.endsWith(".local")
    );
}

export async function validateExternalUrl(
    input: string,
): Promise<URL> {
    const url = new URL(input);

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("UNSUPPORTED_URL_PROTOCOL");
    }

    if (url.username || url.password) {
        throw new Error("URL_CREDENTIALS_NOT_ALLOWED");
    }

    if (isBlockedHostname(url.hostname)) {
        if (env.NODE_ENV === "production") {
            throw new Error("PRIVATE_URL_NOT_ALLOWED");
        }

        return url;
    }

    const ipType = net.isIP(url.hostname);

    if (ipType === 4 && isPrivateIPv4(url.hostname)) {
        if (env.NODE_ENV === "production") {
            throw new Error("PRIVATE_URL_NOT_ALLOWED");
        }

        return url;
    }

    if (ipType === 6 && isPrivateIPv6(url.hostname)) {
        if (env.NODE_ENV === "production") {
            throw new Error("PRIVATE_URL_NOT_ALLOWED");
        }

        return url;
    }

    /*
     * DNS resolution protects against domains that resolve to
     * private infrastructure.
     */
    const addresses = await dns.lookup(url.hostname, {
        all: true,
    });

    if (env.NODE_ENV === "production") {
        for (const address of addresses) {
            if (
                address.family === 4 &&
                isPrivateIPv4(address.address)
            ) {
                throw new Error("PRIVATE_URL_NOT_ALLOWED");
            }

            if (
                address.family === 6 &&
                isPrivateIPv6(address.address)
            ) {
                throw new Error("PRIVATE_URL_NOT_ALLOWED");
            }
        }
    }

    return url;
}