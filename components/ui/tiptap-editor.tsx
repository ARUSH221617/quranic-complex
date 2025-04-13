"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline"; // Import Underline extension
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "./button";
import {
  Bold,
  Italic,
  Underline, // Underline icon
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon, // Link icon
  HighlighterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";

export interface TipTapEditorProps {
  value: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}

/**
 * A rich text editor component using Tiptap and shadcn/ui components.
 */
export function TipTapEditor({
  value,
  onChangeAction,
  placeholder = "Write something...",
  dir = "ltr",
}: TipTapEditorProps) {
  const editor = useEditor({
    // Define the extensions (features) the editor should use
    extensions: [
      StarterKit.configure({
        // Basic text formatting (bold, italic, paragraphs, etc.)
        // Exclude Strike and Underline from StarterKit if you configure them separately
        // strike: false, // We configure Strike below
      }),
      UnderlineExtension, // Add the Underline extension
      Link.configure({
        // Configure the Link extension
        openOnClick: false, // Don't open links immediately on click in the editor
        autolink: true, // Automatically detect and create links from URLs
        HTMLAttributes: {
          // Add CSS classes to link elements
          class:
            "text-blue-500 hover:text-blue-700 underline underline-offset-4 cursor-pointer",
          rel: "noopener noreferrer nofollow", // Security and SEO attributes
          target: "_blank", // Open links in a new tab
        },
      }),
      Highlight.configure({
        // Configure the Highlight extension
        multicolor: true, // Allow multiple highlight colors (though we only use yellow here)
        HTMLAttributes: {
          // Add CSS classes to highlight elements
          class: "bg-yellow-200 dark:bg-yellow-800 rounded px-1 py-0.5",
        },
      }),
      Placeholder.configure({
        // Configure the Placeholder extension
        placeholder, // Set the placeholder text
        // Optional: CSS class for the placeholder
        // placeholderClass: 'text-gray-400 italic',
      }),
    ],
    // Initial content for the editor
    content: value,
    // Editor properties and attributes
    editorProps: {
      attributes: {
        // Apply CSS classes to the editable area
        class: cn(
          "prose prose-sm dark:prose-invert", // Base prose styling
          "max-w-none min-h-[150px]", // Ensure minimum height and full width
          "p-3 border-t", // Add padding and top border separating from toolbar
          "focus:outline-none", // Remove default focus outline
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100", // Background and text colors
          "rounded-b-md", // Round bottom corners
        ),
        dir, // Set text direction (ltr or rtl)
      },
    },
    // Callback function triggered when the editor content changes
    onUpdate: ({ editor }) => {
      onChangeAction(editor.getHTML()); // Call the provided onChange function with the new HTML content
    },
  });

  // Callback to handle setting/unsetting links
  const setLink = React.useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    // Prompt the user for the URL
    const url = window.prompt("URL", previousUrl);

    // If the user cancelled the prompt, do nothing
    if (url === null) {
      return;
    }

    // If the user entered an empty URL, remove the link
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Otherwise, set or update the link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Render null if the editor instance is not yet available
  if (!editor) {
    return null;
  }

  // Render the editor UI
  return (
    <div className="rounded-md border border-input bg-background" dir={dir}>
      {/* Toolbar section */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-1 bg-gray-50 dark:bg-gray-800 rounded-t-md">
        {/* Bold Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        {/* Italic Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        {/* Underline Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        {/* Strikethrough Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        {/* Link Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={setLink}
          aria-label="Set link"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
        {/* Code Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Toggle code"
        >
          <Code className="h-4 w-4" />
        </Toggle>
        {/* Highlight Toggle Button */}
        <Toggle
          size="sm"
          pressed={editor.isActive("highlight")}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          aria-label="Toggle highlight"
        >
          <HighlighterIcon className="h-4 w-4" />
        </Toggle>
        {/* Bullet List Toggle Button */}
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
        {/* Ordered List Toggle Button */}
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
      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}

// --- Wrapper App Component for Demonstration ---
// This component demonstrates how to use the TipTapEditor
export default function App() {
  const [editorContent, setEditorContent] = React.useState(
    "<p>Hello World! 🌎️</p><p>Start typing here...</p>",
  );

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
    // You could potentially save the content here, e.g., send it to an API
    console.log("Editor content updated:", newContent);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-gray-100 dark:bg-gray-800 min-h-screen">
      {/* Load Tailwind CSS (ensure this is present in your actual project setup) */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Load Inter font (optional, but recommended for shadcn/ui) */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`body { font-family: 'Inter', sans-serif; }`}</style>

      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Tiptap Editor Example
      </h1>
      <TipTapEditor
        value={editorContent}
        onChangeAction={handleContentChange}
        placeholder="Enter your text here..."
      />

      {/* Optional: Display the raw HTML output for debugging/demonstration */}
      <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Raw HTML Output:
        </h2>
        <pre className="text-xs p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded overflow-x-auto">
          <code>{editorContent}</code>
        </pre>
      </div>
    </div>
  );
}
