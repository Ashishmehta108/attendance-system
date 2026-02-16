import { Router, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { db, user } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession } from "../middleware/session.js";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req: SessionRequest, file, cb) => {
        const userId = req.session!.user!.id;
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error("Only images are allowed"));
    }
});

router.use(requireSession);

// Upload avatar
router.post("/avatar", upload.single("avatar"), async (req: SessionRequest, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }

    const userId = req.session!.user!.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    try {
        await db.update(user).set({
            image: avatarUrl,
            updatedAt: new Date(),
        }).where(eq(user.id, userId));

        // Return the path
        res.json({ success: true, avatarUrl });
    } catch (error) {
        console.error("Upload update error:", error);
        res.status(500).json({ error: "Failed to update user avatar" });
    }
});

export const uploadRoutes: Router = router;
