import { db, user } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

console.log("Loading .env from:", path.join(__dirname, "../../../../.env"));

async function seedAdmin() {
    const adminEmail = "admin@example.com";
    const adminPassword = "admin123";
    const adminName = "System Admin";

    console.log("Checking if admin already exists...");

    const existingAdmin = await db.query.user.findFirst({
        where: eq(user.email, adminEmail),
    });

    if (existingAdmin) {
        console.log("Admin user already exists. Skipping seed.");
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const userId = randomUUID();

    console.log("Creating admin user...");

    await db.insert(user).values({
        id: userId,
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    console.log("Admin user created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error("Error seeding admin:", err);
    process.exit(1);
});
