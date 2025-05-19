import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale, // Needed for Radar and PolarArea
} from "chart.js";
import {
  Line,
  Bar,
  Pie,
  Doughnut,
  Radar,
  PolarArea,
  Bubble,
  Scatter,
} from "react-chartjs-2";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale, // Register for Radar and PolarArea
);

// Define props interface for the ChartPreview component
interface ChartPreviewProps {
  result: {
    success: boolean;
    message: string;
    chart?: {
      type:
        | "bar"
        | "line"
        | "pie"
        | "doughnut"
        | "radar"
        | "polarArea"
        | "bubble"
        | "scatter";
      data: any; // Chart.js data object
      options?: any; // Chart.js options object
      width?: number;
      height?: number;
    };
    error?: string;
  };
}

export const ChartPreview: React.FC<ChartPreviewProps> = ({ result }) => {
  // Extract chart parameters from the result object
  const { chart } = result;

  if (!chart) {
    // Handle cases where chart data is missing in the result
    return (
      <div className="text-red-500">
        Chart data not available in the result.
      </div>
    );
  }

  const { type, data, options = {}, width, height } = chart;

  // Determine which react-chartjs-2 component to render based on type
  const ChartComponent = {
    line: Line,
    bar: Bar,
    pie: Pie,
    doughnut: Doughnut,
    radar: Radar,
    polarArea: PolarArea,
    bubble: Bubble,
    scatter: Scatter,
  }[type];

  if (!ChartComponent) {
    // Fallback for unsupported types, though the schema should prevent this
    return <div className="text-red-500">Unsupported chart type: {type}</div>;
  }

  // Provide default aspect ratio logic and integrate width/height into options
  const chartOptions = {
    ...options,
    maintainAspectRatio: !(width || height), // Maintain aspect ratio if no explicit dimensions
    // Chart.js handles size via the container element or explicit width/height props on the component
    // Setting them in options is typically for responsiveness configuration
  };

  // Use inline style for container to control dimensions if provided
  const containerStyle = {
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : "auto",
    // Ensure the container has a position other than static if using absolute positioning in chart options
    position: "relative" as "relative", // Explicitly type for CSS
  };

  return (
    <div style={containerStyle}>
      {/* Pass width and height props directly to the component */}
      {ChartComponent && (
        <ChartComponent
          data={data}
          options={chartOptions}
          width={width}
          height={height}
        />
      )}
    </div>
  );
};
