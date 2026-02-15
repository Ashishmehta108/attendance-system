import {  pgTable, text } from "drizzle-orm/pg-core";

export const role={
    student: "student",
    teacher: "teacher",
    admin: "admin",
};

export const user=pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    image: text("image"),
    password: text("password").notNull(),
    role: text("role").notNull().default("student"),
});

