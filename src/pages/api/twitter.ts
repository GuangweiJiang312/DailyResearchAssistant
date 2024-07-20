// pages/api/twitter.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeTweetsWithGPT } from "./analyzeTweets"
import { Db, MongoClient } from 'mongodb';
// import redis from '../../lib/redis';

// Create a single MongoClient instance (singleton pattern)
let dbInstance: Db | null = null;
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
}
const client = new MongoClient(uri);

async function connectToDatabase() {
    if (dbInstance) {
        console.log('Using existing database instance');
        return dbInstance;
    }

    try {
        // Ensure the client is connected
        await client.connect();
        console.log('Connected to MongoDB');
        dbInstance = client.db("twitter_analysis"); // Use or create the database
        return dbInstance;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw new Error('Failed to connect to MongoDB');
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        const { keyword } = req.body;
        console.log("keyworld !!!!!!!!!!!");
        console.log("keyword", keyword);
        const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=100`;

        console.log("before sent request");
        console.log("Bearer Token:", process.env.TWITTER_BEARER_TOKEN);

        try {

            // Check for cached results in Redis first
            // const cacheKey = `tweets:${keyword}`;
            // const cachedResults = await redis.get(cacheKey);
            // if (cachedResults) {
            //     console.log('Returning cached results');
            //     return res.status(200).json({ result: JSON.parse(cachedResults) });
            // }

            console.log("1..............");
            const db = await connectToDatabase();
            console.log("db :", db);
            console.log("2..............");
            const collection = db.collection('tweets_analysis');
            console.log("create/connect database");

            const response = await fetch(url, {
                method: 'GET', 
                headers: {
                    'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
                }
            });

            console.log("after send request");
            console.log(response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("response data !!!!!!!!!!!!!!");
            console.log(data);

            // const analysisResults = await analyzeTweetsWithGPT(keyword, data);

            // console.log("analysisResults !!!!!!!!!");
            // console.log(analysisResults);

            // 检查是否存在现有记录
            // const existingRecord = await collection.findOne({ keyword });
            // console.log("existingRecord", existingRecord);
            // console.log("update database");
            // if (existingRecord) {
            //     await collection.updateOne({ keyword }, { $set: { results: analysisResults } });
            // } else {
            //     await collection.insertOne({ keyword, results: analysisResults });
            // }

            // Cache the new results in Redis for 1 hour
            // await redis.set(cacheKey, JSON.stringify(analysisResults), 'EX', 3600);

            res.status(200).json({ result: data }); // 直接返回获取到的数据
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ message: 'Error fetching tweets', error: error.message });
            } else {
                // If it's not an Error instance, send a generic error message
                res.status(500).json({ message: 'Error fetching tweets', error: 'An unexpected error occurred' });
            }
            // res.status(500).json({ message: 'Error fetching tweets', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
