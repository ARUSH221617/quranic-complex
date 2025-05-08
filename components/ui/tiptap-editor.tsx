"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  HighlighterIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code2,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";

export interface TipTapEditorProps {
  value: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  showKeyboardShortcuts?: boolean;
}

const KeyboardShortcutsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ["Ctrl", "B"], description: "Bold" },
    { keys: ["Ctrl", "I"], description: "Italic" },
    { keys: ["Ctrl", "U"], description: "Underline" },
    { keys: ["Ctrl", "K"], description: "Link" },
    { keys: ["Ctrl", "Z"], description: "Undo" },
    { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
    { keys: ["Ctrl", "Alt", "1"], description: "Heading 1" },
    { keys: ["Ctrl", "Alt", "2"], description: "Heading 2" },
    { keys: ["Ctrl", "Alt", "3"], description: "Heading 3" },
    { keys: ["Ctrl", "Shift", "L"], description: "Left Align" },
    { keys: ["Ctrl", "Shift", "E"], description: "Center Align" },
    { keys: ["Ctrl", "Shift", "R"], description: "Right Align" },
    { keys: ["Ctrl", "Shift", "J"], description: "Justify" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * A rich text editor component using Tiptap and shadcn/ui components.
 */
export function TipTapEditor({
  value,
  onChangeAction,
  placeholder = "Write something...",
  dir = "ltr",
  showKeyboardShortcuts = true,
}: TipTapEditorProps) {
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class:
            "text-blue-500 hover:text-blue-700 underline underline-offset-4 cursor-pointer",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-800 rounded px-1 py-0.5",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert",
          "max-w-none min-h-[150px]",
          "p-3 border-t",
          "focus:outline-none",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
          "rounded-b-md",
        ),
        dir,
      },
    },
    onUpdate: ({ editor }) => {
      onChangeAction(editor.getHTML());
    },
  });

  // Callback to handle setting/unsetting links
  const setLink = React.useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
  );

  return (
    <div className="rounded-md border border-input bg-background" dir={dir}>
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-1 rounded-t-md">
        {/* Text Style Controls */}
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
            aria-label="Toggle underline"
          >
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Toggle strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </div>

        <ToolbarDivider />

        {/* Heading Controls */}
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="Toggle h1"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="Toggle h2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-label="Toggle h3"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </div>

        <ToolbarDivider />

        {/* List Controls */}
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            aria-label="Toggle bullet list"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            aria-label="Toggle ordered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        <ToolbarDivider />

        {/* Special Formatting */}
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive("link")}
            onPressedChange={setLink}
            aria-label="Set link"
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            aria-label="Toggle code"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("codeBlock")}
            onPressedChange={() =>
              editor.chain().focus().toggleCodeBlock().run()
            }
            aria-label="Toggle code block"
          >
            <Code2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("highlight")}
            onPressedChange={() =>
              editor.chain().focus().toggleHighlight().run()
            }
            aria-label="Toggle highlight"
          >
            <HighlighterIcon className="h-4 w-4" />
          </Toggle>
        </div>

        <ToolbarDivider />

        {/* History Controls */}
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => editor.chain().focus().undo().run()}
            aria-label="Undo"
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => editor.chain().focus().redo().run()}
            aria-label="Redo"
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Toggle>
        </div>

        {showKeyboardShortcuts && (
          <>
            <ToolbarDivider />
            <div className="flex items-center">
              <Toggle
                size="sm"
                pressed={showShortcuts}
                onPressedChange={() => setShowShortcuts(!showShortcuts)}
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Toggle>
            </div>
          </>
        )}
      </div>

      <EditorContent editor={editor} />

      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
