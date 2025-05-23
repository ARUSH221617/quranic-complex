import { memo } from "react";
import { motion } from "framer-motion";
import { ImageIcon, LoaderIcon, DownloadIcon } from "./icons";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ImageGenerationResult {
  success: boolean;
  message: string;
  image?: {
    url: string;
    modelResponse?: any;
  };
  errorDetails?: string;
}

interface ImagePreviewProps {
  isLoading?: boolean;
  result?: ImageGenerationResult;
  args?: {
    prompt: string;
    size?: string;
    style?: string;
  };
}

export function ImagePreview({ isLoading, result, args }: ImagePreviewProps) {
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
          <div className="font-medium">Generating image...</div>
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
          <ImageIcon size={16} />
        </div>
        <div className="font-medium">{result.success ? "Generated Image" : "Generation Failed"}</div>
      </div>
      <div className="p-4 bg-muted dark:bg-muted/50">
        {result.success && result.image?.url && (
          <div className="w-full">
            <div className="relative group">
              <img
                src={result.image.url}
                alt={args?.prompt || "Generated image"}
                className="w-full rounded-lg bg-background object-contain"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => {
                        if (result.image?.url) {
                          const link = document.createElement('a');
                          link.href = result.image.url;
                          link.download = `generated-image-${Date.now()}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                    >
                      <DownloadIcon size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download image</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {args?.prompt}
            </p>
          </div>
        )}
        {result.errorDetails && (
          <p className="text-sm text-destructive">{result.errorDetails}</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(ImagePreview);
