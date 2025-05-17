import { memo, useState } from "react";
import { motion } from "framer-motion";
import { LoaderIcon, LinkIcon, FileIcon } from "./icons";
import Link from "next/link";

interface ScrapedLink {
  href: string;
  text: string;
}

interface FetchUrlResult {
  url: string;
  status: number;
  title?: string;
  description?: string;
  links: ScrapedLink[];
  rawHtml: string;
  rawText: string;
}

interface FetchUrlCardProps {
  result?: FetchUrlResult;
  isLoading?: boolean;
}

const FetchUrlCardComponent = ({
  result,
  isLoading = false,
}: FetchUrlCardProps) => {
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <motion.div
        className="w-full border rounded-xl p-4 flex items-center justify-center dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="animate-spin">
          <LoaderIcon size={16} />
        </div>
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </motion.div>
    );
  }

  if (!result) {
    return null;
  }

  const filteredLinks = result.links.filter(
    (link) =>
      link.href.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.text && link.text.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const displayedLinks = showAllLinks
    ? filteredLinks.slice(0, 100)
    : filteredLinks.slice(0, 10);

  return (
    <motion.div
      className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-2 sm:p-4 bg-muted dark:bg-muted/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-primary/10 rounded-full p-1 flex items-center justify-center">
            <FileIcon size={16} />
          </div>
          <h3 className="font-medium text-sm sm:text-base">
            Fetched URL Content
          </h3>
        </div>

        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 group">
            <span className="font-semibold sm:min-w-[70px]">URL:</span>
            <Link
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex-1 truncate group-hover:text-primary/80"
            >
              {result.url}
            </Link>
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold sm:min-w-[70px]">Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs w-fit ${
                result.status >= 200 && result.status < 300
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {result.status}
            </span>
          </p>

          {result.title && (
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold sm:min-w-[70px]">Title:</span>
              <span className="flex-1 hover:text-foreground transition-colors">
                {result.title}
              </span>
            </p>
          )}

          {result.description && (
            <div className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row gap-1 sm:gap-2">
              <span className="font-semibold sm:min-w-[70px]">
                Description:
              </span>
              <div className="flex-1">
                <p className={`${!expandedDescription && "line-clamp-3"}`}>
                  {result.description}
                </p>
                {result.description.length > 200 && (
                  <button
                    onClick={() => setExpandedDescription(!expandedDescription)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {expandedDescription ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {result.links && result.links.length > 0 && (
          <div className="mt-4 bg-background/50 p-2 sm:p-3 rounded-lg border dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                Links ({filteredLinks.length})
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs px-2 py-1 rounded border dark:border-zinc-700 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
                />
                {filteredLinks.length > 10 && (
                  <button
                    onClick={() => setShowAllLinks(!showAllLinks)}
                    className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors whitespace-nowrap"
                  >
                    {showAllLinks ? "Show Less" : "Show All"}
                  </button>
                )}
              </div>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto text-xs sm:text-sm text-muted-foreground pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {displayedLinks.map((item, index) => (
                <motion.li
                  key={`${item.href}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 1) }}
                  className="flex items-start gap-2 p-2 bg-background/80 hover:bg-background rounded-lg transition-colors group border border-transparent hover:border-muted"
                >
                  <div className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                    <LinkIcon size={14} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors truncate"
                    >
                      {item.href}
                    </Link>
                    {item.text && (
                      <span className="text-xs italic text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors line-clamp-2">
                        {item.text}
                      </span>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const FetchUrlCard = memo(FetchUrlCardComponent);

export default FetchUrlCard;
