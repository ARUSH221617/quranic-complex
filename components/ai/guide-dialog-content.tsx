import React from "react";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "./language-selector";

interface GuideDialogContentProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function GuideDialogContent({
  selectedLanguage,
  onLanguageChange,
}: GuideDialogContentProps) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div>
        <h3 className="text-lg font-semibold mb-1">
          Welcome to the AI Chat Guide!
        </h3>
        <p className="text-muted-foreground text-sm">
          This guide explains the different modes and capabilities of the AI to
          help you interact effectively.
        </p>
      </div>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">
          Voice Recognition Settings
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Select the language for microphone input here.
        </p>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          className="w-full"
        />
      </section>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">AI Modes & Personas</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <span className="font-semibold">ARUSH (Agent Mode):</span> Advanced
            agent for content creation, editing, and knowledge workflows. Uses
            the Artifacts sidebar and has access to powerful tools.
          </li>
          <li>
            <span className="font-semibold">Regular Mode:</span> Friendly
            assistant for concise, helpful conversational responses.
          </li>
        </ul>
      </section>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">
          Interaction Guidelines (Focus)
        </h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Focus on substance over empty praise.</li>
          <li>Engage critically, question assumptions, and identify biases.</li>
          <li>Offer counterpoints and reasoned disagreement when warranted.</li>
        </ul>
      </section>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">
          Key Capabilities & Tools (Agent Mode)
        </h4>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li>
            <span className="font-semibold">Artifacts Management:</span>
            <ul className="list-circle list-inside ml-5">
              <li>
                <code>createDocument</code>: Generate substantial text, code, or
                structured content.
              </li>
              <li>
                <code>updateDocument</code>: Revise existing documents based on
                your feedback.
              </li>
              <li>
                <code>getDocument</code>: Read the content of an existing
                document.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">News Management:</span>
            <ul className="list-circle list-inside ml-5">
              <li>
                <code>createNews</code>, <code>getLatestNews</code>,{" "}
                <code>updateNews</code>, <code>createNewsTranslation</code>,{" "}
                <code>searchNewsByTitle</code>
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Other Tools:</span>
            <ul className="list-circle list-inside ml-5">
              <li>
                <code>webSearch</code>, <code>generateImage</code>,{" "}
                <code>fetchUrl</code>, <code>generateChart</code>,{" "}
                <code>generateCurrencyPrice</code>,{" "}
                <code>generateCryptoPrice</code>, <code>generateSpeech</code>
              </li>
            </ul>
          </li>
        </ul>
      </section>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">
          Specific Content Handling
        </h4>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li>
            <span className="font-semibold">Code Generation (Python):</span>
            <span className="block ml-2 text-muted-foreground">
              Snippets are self-contained, executable, concise (&lt;15 lines),
              use the standard library, handle errors, and avoid interactive
              input or file/network access.
            </span>
          </li>
          <li>
            <span className="font-semibold">Spreadsheet Creation:</span>
            <span className="block ml-2 text-muted-foreground">
              Spreadsheets are created in CSV format with meaningful headers and
              data.
            </span>
          </li>
          <li>
            <span className="font-semibold">Updating Content:</span>
            <span className="block ml-2 text-muted-foreground">
              Improvements use <code>updateDocument</code> logic to revise text,
              code, or sheets based on your prompt.
            </span>
          </li>
        </ul>
      </section>
      <Separator />
      <section>
        <h4 className="text-md font-semibold mb-1">
          Tips for Effective Prompts
        </h4>
        <p className="text-sm text-muted-foreground">
          Be clear and specific in your requests. In Agent mode, mention tools
          or describe tasks to trigger tool use.
        </p>
      </section>
      <Separator />
      <p className="text-xs text-muted-foreground">
        This guide provides an overview of the AI's capabilities based on its
        internal instructions.
      </p>
    </div>
  );
}
