"use client";
import { useState } from "react";
import {
  Brain,
  Settings,
  Maximize2,
  X,
  RefreshCcw,
  Sparkles,
  Send,
} from "lucide-react";

export default function AIPanelButton() {
  const [showAIPanel, setShowAIPanel] = useState(false);
  return (
    <>
      <button
        className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-slate-100 text-slate-600 hover:text-[#0c77f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c77f2]/40"
        aria-label="Ask AI"
        onClick={() => setShowAIPanel(true)}
      >
        <Brain size={24} />
      </button>
      {showAIPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowAIPanel(false)}
          />
          <aside className="relative w-96 h-screen bg-white shadow-lg flex flex-col animate-in slide-in-from-right-10">
            <header className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-xl font-medium text-gray-800">
                Ask about this page
              </h1>
              <div className="flex items-center space-x-3">
                <button className="text-gray-500 hover:text-gray-700">
                  <Settings size={20} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Maximize2 size={20} />
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAIPanel(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-800">Chat</h2>
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full">
                    BETA
                  </span>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  <RefreshCcw size={18} />
                </button>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Sparkles className="text-blue-500 mr-3 mt-1" size={22} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Not sure what to ask?
                    </p>
                    <p className="text-sm text-gray-600">
                      Click below for suggestions!
                    </p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Show quick start prompts
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <footer className="p-4 border-t border-gray-200">
              <div className="relative flex items-center">
                <input
                  className="w-full py-3 px-4 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter a prompt here"
                  type="text"
                />
                <button className="absolute right-3 text-blue-500 hover:text-blue-700">
                  <Send size={22} />
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                Responses may display inaccurate or offensive information that
                doesn't represent Google's views.
                <a className="underline hover:text-gray-700" href="#">
                  additional details
                </a>
              </p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
