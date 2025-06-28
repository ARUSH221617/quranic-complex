import { useEffect, useRef, useState } from "react";

export function useConditionalScrollToBottom<T extends HTMLElement>(
  shouldScroll: boolean,
) {
  const containerRef = useRef<T>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [hasScrolledOnMount, setHasScrolledOnMount] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect for initial scroll on mount
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "instant" });
      setHasScrolledOnMount(true);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

      if (!isAtBottom) {
        setIsUserScrolling(true);
        // Clear existing timeout
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        // Set user scrolling to false after 2 seconds of no scrolling
        userScrollTimeoutRef.current = setTimeout(() => {
          setIsUserScrolling(false);
        }, 2000);
      } else {
        setIsUserScrolling(false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      shouldScroll &&
      !isUserScrolling &&
      hasScrolledOnMount &&
      endRef.current
    ) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouldScroll, isUserScrolling, hasScrolledOnMount]);

  return [containerRef, endRef] as const;
}
