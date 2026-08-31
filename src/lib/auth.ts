import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.ts";
import { notificationQueue } from "../queues/notificationQueue.ts";
import { logger } from "./logger.ts";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:6767",
    trustedOrigins: (request) => {
        const origin = request?.headers?.get("origin");
        return origin ? [origin] : [];
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        logger.info({ userId: user.id, email: user.email }, 'New user registered. Queuing welcome email...');
                        await notificationQueue.add('send-welcome-email', {
                            email: user.email,
                            name: user.name ?? undefined
                        });
                    } catch (err) {
                        logger.error(err, 'Failed to queue welcome email on user creation');
                    }
                }
            }
        }
    }
});