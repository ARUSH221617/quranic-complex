"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { LoaderIcon, FileIcon } from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface WebSearchResult {
  results: SearchResult[];
  summary: string;
}

interface WebSearchCardProps {
  /**
   * The result object returned by the webSearch tool.
   */
  result?: WebSearchResult;
  /**
   * Flag to indicate if search data is still loading.
   */
  isLoading?: boolean;
}

const WebSearchCardComponent = ({ result, isLoading = false }: WebSearchCardProps) => {
  if (isLoading) {
    return (
      <motion.div
        className="w-full border rounded-xl p-4 flex items-center justify-center dark:border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="animate-spin">
          <LoaderIcon size={16} />
        </div>
      </motion.div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <motion.div
      className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="p-4 bg-muted dark:bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-4">
            <FileIcon size={16} />
          </div>
          <h3 className="font-medium">Search Results</h3>
        </div>

        {result.summary && (
          <p className="text-sm text-muted-foreground mb-3">{result.summary}</p>
        )}
        <ul className="space-y-3">
          {result.results.map((item, index) => (
            <li key={index} className="border p-3 rounded-lg hover:shadow transition-shadow">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {item.title}
              </a>
              <p className="text-sm text-muted-foreground">{item.snippet}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export const WebSearchCard = memo(WebSearchCardComponent);

export default WebSearchCard;