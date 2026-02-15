import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { db, user, session, account, verification } from "@attendance-app/db";
import { ac, admin, instructor, student } from "./auth/permissions.js";

const API_URL = process.env.API_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

export const auth = betterAuth({
  baseURL: API_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
    },
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        instructor,
        student,
      },
      defaultRole: "student",
    }),
  ],
  trustedOrigins: [process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"],
});
