import { memo, useState } from "react";
import { motion } from "framer-motion";
import { LoaderIcon } from "./icons";

interface CurrencyPriceResult {
  base: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
  time_next_update_utc: string;
  raw?: any;
}

interface CurrencyPriceCardProps {
  result?: CurrencyPriceResult;
  isLoading?: boolean;
}

const CurrencyPriceCardComponent = ({
  result,
  isLoading = false,
}: CurrencyPriceCardProps) => {
  const [search, setSearch] = useState("");

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

  const filteredRates = Object.entries(result.rates).filter(
    ([code]) => code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-2 sm:p-4 bg-muted dark:bg-muted/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-5 bg-primary/10 rounded-full p-1 flex items-center justify-center">
            <span role="img" aria-label="currency">
              💱
            </span>
          </div>
          <h3 className="font-medium text-sm sm:text-base">
            Currency Exchange Rates
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold sm:min-w-[90px]">Base:</span>
            <span className="flex-1 uppercase">{result.base}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold sm:min-w-[90px]">Last Update:</span>
            <span className="flex-1">{result.time_last_update_utc}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold sm:min-w-[90px]">Next Update:</span>
            <span className="flex-1">{result.time_next_update_utc}</span>
          </p>
        </div>

        <div className="mt-4 bg-background/50 p-2 sm:p-3 rounded-lg border dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              Rates ({filteredRates.length})
            </p>
            <input
              type="text"
              placeholder="Search currency code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-2 py-1 rounded border dark:border-zinc-700 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            />
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto text-xs sm:text-sm text-muted-foreground pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {filteredRates.length === 0 && (
              <li className="italic text-muted-foreground/70">No results found.</li>
            )}
            {filteredRates.map(([code, rate]) => (
              <li
                key={code}
                className="flex items-center gap-2 p-2 bg-background/80 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-muted"
              >
                <span className="font-mono font-semibold uppercase w-14">{code}</span>
                <span className="flex-1 text-right tabular-nums">{rate}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export const CurrencyPriceCard = memo(CurrencyPriceCardComponent);

export default CurrencyPriceCard;
