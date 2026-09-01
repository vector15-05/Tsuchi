export const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return true; // Allow non-browser / server-to-server requests

    const configuredFrontend = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
    const cleanOrigin = origin.replace(/\/$/, '');

    if (configuredFrontend && cleanOrigin === configuredFrontend) return true;

    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://client-eta-ten-87.vercel.app',
    ];

    if (allowedOrigins.includes(cleanOrigin)) return true;

    // Allow Vercel preview deployments (*.vercel.app)
    if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) return true;

    return false;
};
