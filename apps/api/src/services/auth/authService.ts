import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { UserModel } from "../../models/User.js";
import { SessionModel } from "../../models/Session.js";

const SESSION_DURATION_MS =
    1000 * 60 * 60 * 24 * 30;

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function hashToken(token: string): string {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function registerUser(
    email: string,
    password: string,
) {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await UserModel.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(
        password,
        12,
    );

    const user = await UserModel.create({
        email: normalizedEmail,
        passwordHash,
    });

    return user;
}

export async function authenticateUser(
    email: string,
    password: string,
) {
    const normalizedEmail = normalizeEmail(email);

    const user = await UserModel.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const validPassword = await bcrypt.compare(
        password,
        user.passwordHash,
    );

    if (!validPassword) {
        throw new Error("INVALID_CREDENTIALS");
    }

    return user;
}

export async function createSession(
    userId: string,
): Promise<string> {
    const token = generateToken();

    const tokenHash = hashToken(token);

    const expiresAt = new Date(
        Date.now() + SESSION_DURATION_MS,
    );

    await SessionModel.create({
        userId,
        tokenHash,
        expiresAt,
    });

    return token;
}

export async function getUserFromSession(
    token: string,
) {
    const tokenHash = hashToken(token);

    const session = await SessionModel.findOne({
        tokenHash,
        expiresAt: {
            $gt: new Date(),
        },
    });

    if (!session) {
        return null;
    }

    const user = await UserModel.findById(
        session.userId,
    );

    return user;
}

export async function deleteSession(
    token: string,
): Promise<void> {
    const tokenHash = hashToken(token);

    await SessionModel.deleteOne({
        tokenHash,
    });
}