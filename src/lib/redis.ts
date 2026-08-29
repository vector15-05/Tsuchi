import { Redis } from 'ioredis';

const raw = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function createRedisFromUrl(urlStr: string) {
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

        console.log('Redis connecting to', `${url.protocol}//${url.hostname}:${options.port}`);

        return new Redis(options);
    } catch (err) {
        console.error('Invalid REDIS_URL:', urlStr, err);
        return new Redis('redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
    }
}

const connect = createRedisFromUrl(raw);

connect.on('connect', () => console.log('Redis: connect'));
connect.on('ready', () => console.log('Redis: ready'));
connect.on('close', () => console.log('Redis: close'));
connect.on('reconnecting', (delay: any) => console.log('Redis: reconnecting in', delay));
connect.on('error', (err) => console.log('Redis connection Error occured:', err));

export default connect;

