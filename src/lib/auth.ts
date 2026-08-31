import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.ts";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:6767",
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:5173"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true
    }
});