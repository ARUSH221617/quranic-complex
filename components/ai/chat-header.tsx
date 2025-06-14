"use client";

import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

import { ModelSelector } from "@/components/ai/model-selector";
import { SidebarToggle } from "@/components/ai/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { type VisibilityType, VisibilitySelector } from "./visibility-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Settings } from "lucide-react";
import { SettingsDialogContent } from "@/components/ai/settings-dialog-content";
import { GuideDialogContent } from "@/components/ai/guide-dialog-content";

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  // State for controlling dialog visibility
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push("/chat");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}
      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      )}
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}

      {/* Settings Button and Dialog */}
      <Dialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-4 md:px-2 px-2 md:h-fit ml-auto"
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings />
              <span className="md:sr-only">Setting</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Setting</TooltipContent>
        </Tooltip>
        <DialogContent className="max-w-lg rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
          </DialogHeader>
          <SettingsDialogContent />
        </DialogContent>
      </Dialog>

      {/* Guide Button and Dialog */}
      <Dialog open={isGuideDialogOpen} onOpenChange={setIsGuideDialogOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-5 md:px-2 px-2 md:h-fit"
              onClick={() => setIsGuideDialogOpen(true)}
            >
              <Info />
              <span className="md:sr-only">Guid</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Guid</TooltipContent>
        </Tooltip>
        <DialogContent className="max-w-lg rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle>AI Chat Guide</DialogTitle>
          </DialogHeader>
          <GuideDialogContent />
        </DialogContent>
      </Dialog>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
