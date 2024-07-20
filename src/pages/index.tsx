import { useState } from 'react';

interface Tweet {
  Title: string;
  Content: string;
  Text: string;
  Links: string[];
  Id: string;
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false); 

  async function searchTweets() {
    setLoading(true);
    const response = await fetch('/api/twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword })
    });

    if (response.ok) {
      const data = await response.json();
      setTweets(data.result); // Assume data is the array of tweet objects
      setLoading(false);
      console.log("data", data.result);
    } else {
      console.error('Failed to fetch tweets');
      setLoading(false);
      setTweets([]); // Clear previous results if the search failed
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="search-bar mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search Twitter"
          className="border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none"
        />
        <button onClick={searchTweets} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Search
        </button>
      </div>
      {loading ? (
        <div>Loading...</div> 
      ) : (
        <ul>
        {tweets.map((tweet, index) => (
          <li key={index} className="bg-white shadow overflow-hidden rounded-md px-6 py-4 mb-4">
            <h3 className="font-bold text-xl">{tweet.Title}</h3>
            <p className="text-gray-800">{tweet.Content}</p>
            <p className="text-gray-600 italic">{tweet.Text}</p>
            <div>
              {tweet.Links?.map((link, linkIndex) => (
                link.startsWith('http') ? <a key={linkIndex} href={link} className="text-blue-500 hover:text-blue-800 visited:text-purple-600">{link}</a> : <span key={linkIndex} className="text-gray-500">Not provided</span>
              ))}
            </div>
            <p className="text-gray-400">Tweet ID: {tweet.Id}</p>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
