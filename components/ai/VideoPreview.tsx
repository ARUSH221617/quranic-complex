import { memo } from "react";
import { motion } from "framer-motion";
import { FileVideoIcon, LoaderIcon } from "./icons";
import { cn } from "@/lib/utils";

interface VideoGenerationResult {
  success: boolean;
  message: string;
  videos?: Array<{
    path: string;
    uri: string;
  }>;
  error?: string;
}

interface VideoPreviewProps {
  isLoading?: boolean;
  result?: VideoGenerationResult;
  args?: {
    prompt: string;
    aspectRatio?: string;
    personGeneration?: string;
    numberOfVideos?: number;
  };
}

export function VideoPreview({ isLoading, result, args }: VideoPreviewProps) {
  if (isLoading || !result) {
    return (
      <motion.div
        className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 flex flex-row gap-2 items-center dark:bg-muted border-b dark:border-zinc-700">
          <div className="text-muted-foreground">
            <div className="animate-spin size-4">
              <LoaderIcon size={16} />
            </div>
          </div>
          <div className="font-medium">Generating video...</div>
        </div>
        <div className="p-4 bg-muted dark:bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Prompt: {args?.prompt || "Loading..."}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full border rounded-xl dark:border-zinc-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4 flex flex-row gap-2 items-center dark:bg-muted border-b dark:border-zinc-700">
        <div className="text-muted-foreground">
          <FileVideoIcon size={16} />
        </div>
        <div className="font-medium">{result.success ? "Generated Video" : "Generation Failed"}</div>
      </div>
      <div className="p-4 bg-muted dark:bg-muted/50 flex flex-col gap-4">
        {result.videos?.map((video, index) => (
          <div key={index} className="w-full">
            <video
              controls
              className="w-full aspect-video rounded-lg bg-background"
              src={video.path}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Video {index + 1}: {args?.prompt}
            </p>
          </div>
        ))}
        {result.error && (
          <p className="text-sm text-destructive">{result.error}</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(VideoPreview);
