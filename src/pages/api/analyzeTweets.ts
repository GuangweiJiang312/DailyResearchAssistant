import { json } from "stream/consumers";
interface TweetData {
    id: string;
    text: string;
  }
  
  interface TweetsResponse {
    data: TweetData[];
  }
  
  interface AnalyzedTweet {
    Title: string;
    Content: string;
    Text: string;
    Links: string[];
    Id: string;
  }
// analyzeTweets.ts
function isKeyOfAnalyzedTweet(key: any): key is keyof AnalyzedTweet {
    return ['Title', 'Content', 'Text', 'Links', 'Id'].includes(key);
}

function formatTweetsData(tweetsData: TweetsResponse): string {
    return tweetsData.data.map(tweet => `Tweet ID: ${tweet.id}, Text: ${tweet.text}`).join('\n');
}

function parseGPTResponse(responseText: string): AnalyzedTweet[] {
    const tweetsData: AnalyzedTweet[] = [];
    const tweetBlocks = responseText.split('***').map(block => block.trim()).filter(block => block !== '');

    tweetBlocks.forEach(block => {
        const lines = block.split('\n');
        const tweet: Partial<AnalyzedTweet> = {};

        lines.forEach(line => {
            // const [key, value] = line.split(':').map(part => part.trim());
            const firstColonIndex = line.indexOf(':');
            const key = line.substring(0, firstColonIndex).trim();
            const value = line.substring(firstColonIndex + 1).trim();
            if (key && value) {
                if (key === 'Links') {
                    // Assuming links are separated by commas if there are multiple links
                    console.log("current link: ", value)
                    tweet[key] = value.includes(',') ? value.split(',').map(link => link.trim()) : [value];
                } else if (isKeyOfAnalyzedTweet(key)) {
                    tweet[key as keyof Omit<AnalyzedTweet, 'Links'>] = value; 
                }
            }
        });

        if (tweet.Title && tweet.Content && tweet.Text && tweet.Links && tweet.Id) {
            tweetsData.push(tweet as AnalyzedTweet);
        }
    });

    return tweetsData;
}

async function fetchTweetDetails(tweetIds: string[]): Promise<any[]> {
    const tweetsDetails = [];

    for (const id of tweetIds) {
        try {
            const url = `https://api.twitter.com/2/tweets/${id}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            tweetsDetails.push(data);
        } catch (error) {
            console.error(`Failed to fetch tweet with ID ${id}:`, error);
        }
    }

    return tweetsDetails;
}


async function analyzeTweetsWithGPT(keyword: string, tweetsData: any) {

    const formattedTweetsData = formatTweetsData(tweetsData);

    const messages = [
        {
            role: "system",
            content: `You are a research assistant tasked with analyzing tweets to find valuable insights for researchers in the field of  "${keyword}".`
        },
        {
            role: "user",
            content: `
Given the latest 100 tweets data related to "${keyword}", I need you to perform an analysis to identify the top 10 tweets that are most valuable for researchers in this field. Each selected tweet should be presented in a structured format with the following details:

1. "Title": A concise title derived from the tweet content or topic.
2. "Main Content": A brief summary of the tweet in one or two sentences, highlighting the main message or insight.
3. "Original Text": The full text of the tweet.
4. "Important Links Included in the Tweet": List any URLs included in the tweet.
5. "Tweet_id": the id contain in each tweet of the latest 100 tweets data.

Follow these steps to perform the analysis:
1. Review each tweet and assess its relevance and value based on the novelty, depth of insight, and relevance to ongoing research in the field of Large Language Models (LLMs).
2. Focus on tweets that discuss new findings, methodologies, or have a high engagement indicating significant interest from the community.
3. Extract and list any links provided in the tweets as these might direct to research papers, articles, or further significant readings.
4. Summarize the main point of each selected tweet in the "Main Content" field to give a quick insight into why the tweet is valuable.
5. Format the data according to the structure provided and ensure all fields are correctly filled for each of the top 10 tweets.

Please proceed with the analysis and present the top 10 tweets in the specified format. Each selected tweet should be presented in a structured format with the following details:\n\n1. "Title": A concise title derived from the tweet content or topic.\n2. "Content": A brief summary of the tweet in one or two sentences, highlighting the main message or insight.\n3. "Text": The full text of the tweet.\n4. "Links": List any URLs included in the tweet.\n5. "Id": the id contained in each selected tweet. \n The data includes:
===
${formattedTweetsData}
===
only return the result in following format, do not contain any other things, Example:
"
start
Title:
Content:
Text:
Links:
Id:
***
...{other}...
***
end
"
`
        }
    ];

    console.log("messages !!!!!!!!");
    console.log(messages);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GPT_BEARER_TOKEN}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                // max_tokens: 1500
            })
        });

        const result = await response.json();
        // console.log("Full result from OpenAI:", JSON.stringify(result, null, 2));

        // Extract and print the actual response message
        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
            console.log("GPT's response:", result.choices[0].message.content);
            const tweets = parseGPTResponse(result.choices[0].message.content);
            console.log("tweets:", tweets);
            return tweets;
        } else {
            console.log("No response message found in the completion object.");
        }

        return result.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw error;
    }
}

export { analyzeTweetsWithGPT };
