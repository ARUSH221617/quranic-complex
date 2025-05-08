import React from "react";

// Define the structure of a news item as streamed by the tool
export interface NewsItem {
  index: number;
  title: string;
  date: string; // Assuming date is streamed as a string (ISO format or similar)
  excerpt: string;
}

interface NewsDisplayProps {
  news: NewsItem[];
}

export const NewsDisplay: React.FC<NewsDisplayProps> = ({ news }) => {
  if (!news || news.length === 0) {
    return null; // Don't render anything if there's no news
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold mb-3">Latest News</h3>
      <ul className="space-y-4">
        {news.map((item, index) => (
          <li key={index} className="border p-3 rounded-md bg-gray-50">
            <h4 className="font-medium text-blue-600">{item.title}</h4>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(item.date).toLocaleDateString()} {/* Format date */}
            </p>
            <p className="text-gray-700 text-sm">{item.excerpt}</p>
            {/* Could add a link here if the slug was included in the streamed data,
                or if we had a function to generate a URL based on slug/id */}
          </li>
        ))}
      </ul>
    </div>
  );
};
