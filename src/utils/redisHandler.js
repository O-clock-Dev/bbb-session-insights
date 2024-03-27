import { Redis } from "ioredis";

export default async function redisHandler(data, method, prefix) {
    const redis = new Redis({ keyPrefix: prefix + ":" });
    let result;

    try {
        switch (method) {
            case "get":
                result = await redis.get(data.email);
                break;
            case "set":
                await redis.set(data.email, JSON.stringify(data));
                result = "OK";
                break;
            default:
                throw new Error('Invalid method');
        }
        return result;
    } catch (error) {
        console.error("Redis operation error:", error);
        return null; 
    } finally {
        await redis.quit();
    }
}