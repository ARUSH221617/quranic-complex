import React, { useRef, useEffect } from "react";
import { Markmap } from "markmap-view";

// Define props interface for the MarkmapPreview component
interface MarkmapPreviewProps {
  result: {
    success: boolean;
    message: string;
    markmap?: string; // JSON string of the Markmap data
    error?: string;
  };
}

export const MarkmapPreview: React.FC<MarkmapPreviewProps> = ({ result }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  // Extract markmap data from the result object
  const { markmap } = result;

  useEffect(() => {
    if (svgRef.current && markmap) {
      try {
        const markmapData = JSON.parse(markmap);

        // If a markmap instance already exists, destroy it
        if (markmapRef.current) {
          markmapRef.current.destroy();
          markmapRef.current = null; // Clear the ref
          // Optionally clear the SVG content if destroy doesn't fully clean up
          svgRef.current.innerHTML = "";
        }

        // Create a new Markmap instance
        markmapRef.current = Markmap.create(svgRef.current, {
          // options go here, e.g., `color: '#007bff'`
        });

        // Render the Markmap data
        markmapRef.current.setData(markmapData);
        markmapRef.current.fit(); // Fit the diagram to the container

        // Add a resize observer to refit the markmap when the container resizes
        const observer = new ResizeObserver(() => {
          if (markmapRef.current) {
            markmapRef.current.fit();
          }
        });

        // Observe the parent container of the SVG
        if (svgRef.current.parentElement) {
          observer.observe(svgRef.current.parentElement);
        }

        // Cleanup function
        return () => {
          if (markmapRef.current) {
            markmapRef.current.destroy();
            markmapRef.current = null; // Clear the ref
          }
          observer.disconnect();
        };
      } catch (error) {
        console.error("Failed to parse or render Markmap data:", error);
        // Optionally update the UI to show an error message
      }
    } else if (svgRef.current && !markmap && markmapRef.current) {
      // Cleanup if data becomes null/undefined but a markmap instance exists
      markmapRef.current.destroy();
      markmapRef.current = null;
      svgRef.current.innerHTML = ""; // Ensure SVG is cleared
    }
  }, [markmap]); // Re-run effect if markmap data changes

  if (!markmap) {
    // Handle cases where markmap data is missing in the result or is an error state
    return (
      <div className="text-red-500">
        Markmap diagram data not available or generation failed.
        {result.error && <div>Error: {result.error}</div>}
      </div>
    );
  }

  // The container div provides a size context for the SVG
  // The SVG itself should be display: block and 100% width/height to fill the container
  return (
    <div className="w-full h-96 overflow-hidden rounded border border-border bg-card flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full block"></svg>
    </div>
  );
};
