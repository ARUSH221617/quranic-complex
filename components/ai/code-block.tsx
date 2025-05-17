"use client";
import React, { useState } from "react";
interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}
import { CopyIcon } from "./icons";

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let textToCopy = "";
    if (Array.isArray(children)) {
      textToCopy = children.join("");
    } else if (typeof children === "string") {
      textToCopy = children;
    } else if (
      typeof children === "object" &&
      "props" in children &&
      typeof children.props.children === "string"
    ) {
      textToCopy = children.props.children;
    } else {
      textToCopy = String(children);
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // fallback or error handling
    }
  };

  if (!inline) {
    return (
      <span
        className="relative group not-prose flex flex-col text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900 whitespace-pre-wrap break-words"
        style={{ display: "block" }}
      >
        <button
          type="button"
          aria-label={copied ? "Copied!" : "Copy code"}
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1"
          tabIndex={0}
        >
          <CopyIcon copied={copied} />
        </button>
        <code {...props} className="">
          {children}
        </code>
      </span>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
