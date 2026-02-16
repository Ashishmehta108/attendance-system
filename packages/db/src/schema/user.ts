import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const role = {
    student: "student",
    teacher: "teacher",
    admin: "admin",
};

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    image: text("image"),
    password: text("password").notNull(),
    role: text("role").notNull().default("student"),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

