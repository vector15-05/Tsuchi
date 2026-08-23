import {Redis} from "ioredis"

const connect = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
})

connect.on('error', (err) => {
    console.log("Redis connection Error occured: ", err);
});

export default connect;

