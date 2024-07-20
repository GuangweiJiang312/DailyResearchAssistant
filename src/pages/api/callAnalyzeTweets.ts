// pages/api/analyzeTweets.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeTweetsWithGPT }  from "./analyzeTweets" // 确保路径正确

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { tweetData, keyword } = req.body;

    try {
      const analyzedResults = await analyzeTweetsWithGPT(keyword, tweetData);
      res.status(200).json({ result: analyzedResults });
    } catch (error) {
      
      if (error instanceof Error) {
        res.status(500).json({ message: 'Error analyzing tweets', error: error.message });
      } else {
        // If it's not an Error instance, send a generic error message
        res.status(500).json({ message: 'Error analyzing tweets', error: 'An unexpected error occurred' });
    }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
