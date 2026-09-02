import { Redis } from 'ioredis';

const raw = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function buildOptions(urlStr: string) {
    try {
        if (/^\/\//.test(urlStr)) {
            urlStr = `redis:${urlStr}`;
        }

        const url = new URL(urlStr);
        const isTls = url.protocol === 'rediss:';

        const options: any = {
            host: url.hostname,
            port: url.port ? parseInt(url.port, 10) : (isTls ? 6380 : 6379),
            maxRetriesPerRequest: null,
        };

        if (url.username) options.username = decodeURIComponent(url.username);
        if (url.password) options.password = decodeURIComponent(url.password);
        if (isTls) options.tls = {};

        return options;
    } catch (err) {
        console.error('Invalid REDIS_URL:', urlStr, err);
        return { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null };
    }
}

/**
 * Creates a fresh ioredis connection for a BullMQ client.
 * BullMQ requires each Queue / Worker / QueueScheduler to have its own
 * dedicated connection — they must NOT share a single instance.
 */
export function createRedisConnection(): Redis {
    const opts = buildOptions(raw);
    const conn = new Redis(opts);
    conn.on('error', (err) => console.error('Redis error:', err.message));
    return conn;
}

// Single shared connection for non-BullMQ use (e.g. caching, health checks).
const sharedConnection = createRedisConnection();
sharedConnection.on('connect', () => console.log('Redis: connect'));
sharedConnection.on('ready', () => {
    const url = new URL(raw.startsWith('//') ? `redis:${raw}` : raw);
    console.log('Redis connecting to', `${url.protocol}//${url.hostname}:${url.port || 6379}`);
    console.log('Redis: ready');
});
sharedConnection.on('close', () => console.log('Redis: close'));
sharedConnection.on('reconnecting', (delay: any) => console.log('Redis: reconnecting in', delay));

export default sharedConnection;
