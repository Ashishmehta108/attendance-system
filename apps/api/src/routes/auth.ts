import { Router } from "express";
import { db, user } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { loginSchema, registerSchema } from "@attendance-app/shared";
import { signToken, setAuthCookie, clearAuthCookie } from "../auth/jwt.js";
import { authenticate } from "../middleware/session.js";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
        }
        const { email, password, name } = parsed.data;
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, email),
        });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = randomUUID();
        // Force role to "student" for self-registration
        await db.insert(user).values({
            id: userId,
            email,
            name,
            password: hashedPassword,
            role: "student",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const token = signToken({ userId, role: "student" });
        setAuthCookie(res, token);

        return res.status(201).json({
            user: {
                id: userId,
                email,
                name,
                role: "student",
            },
            token,
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/sign-in", async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
        }

        const { email, password } = parsed.data;

        const foundUser = await db.query.user.findFirst({
            where: eq(user.email, email),
        });

        if (!foundUser || !foundUser.password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isValidPassword = await bcrypt.compare(password, foundUser.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = signToken({ userId: foundUser.id, role: foundUser.role });
        setAuthCookie(res, token);
        console.log(foundUser)

        return res.json({
            user: {
                id: foundUser.id,
                email: foundUser.email,
                name: foundUser.name,
                role: foundUser.role,
                image: foundUser.image,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/sign-out", (req, res) => {
    clearAuthCookie(res);
    return res.json({ success: true });
});

router.get("/me", authenticate, async (req, res) => {
    if (!req.user) {
        return res.json(null);
    }

    try {
        const foundUser = await db.query.user.findFirst({
            where: eq(user.id, req.user.id),
            columns: {
                password: false,
            },
        });

        if (!foundUser) {
            clearAuthCookie(res);
            return res.json(null);
        }

        return res.json({
            user: foundUser,
            session: {
                user: foundUser,
                session: {
                    id: "jwt-session",
                    userId: foundUser.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                }
            }
        });
    } catch (error) {
        console.error("Me route error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
