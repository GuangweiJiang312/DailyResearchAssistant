// lib/redis.js
import Redis from 'ioredis';

const redis = new Redis({
    port: 15161, // Redis port
    host: 'redis-15161.c11.us-east-1-3.ec2.redns.redis-cloud.com', 
    username: 'default', 
    password: '5ClzKORyt8eKUz1JpL4OSmfWO3cSfeK6', 
    tls: {
        rejectUnauthorized: false,
    }
});

export default redis;
