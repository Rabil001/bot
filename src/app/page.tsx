"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  SquarePen, 
  ChevronDown, 
  Mic, 
  ArrowUp,
  Hexagon,
  ArrowDown,
  Moon,
  Sun,
  StopCircle
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  wireframe?: string;
  isTypingEffect?: boolean;
};

// Component for typewriter effect
const AiMessage = ({ msg, isDarkMode }: { msg: Message; isDarkMode: boolean }) => {
  const [displayedText, setDisplayedText] = useState(msg.isTypingEffect ? "" : msg.content);
  const [showWireframe, setShowWireframe] = useState(!msg.isTypingEffect);

  useEffect(() => {
    if (!msg.isTypingEffect) {
      setDisplayedText(msg.content);
      setShowWireframe(true);
      return;
    }
    
    let i = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (i >= msg.content.length) {
        setDisplayedText(msg.content);
        setShowWireframe(true);
        window.dispatchEvent(new CustomEvent('chat-updated'));
        return;
      }

      setDisplayedText(msg.content.slice(0, i + 1));
      i++;
      
      if (i % 10 === 0) {
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }

      // Variable typing speed logic
      let delay = 10; // fast baseline
      const char = msg.content[i];
      
      if (char === '.' || char === '!' || char === '?') {
        delay = 300; // Pause at sentences
      } else if (char === ',') {
        delay = 100; // Pause at commas
      } else if (char === '\n') {
        delay = 200; // Pause at line breaks
      } else if (Math.random() > 0.95) {
        delay = 60; // Random hesitation
      }

      timeoutId = setTimeout(typeNextChar, delay);
    };

    timeoutId = setTimeout(typeNextChar, 50);

    return () => clearTimeout(timeoutId);
  }, [msg]);

  return (
    <div className="space-y-6 w-full">
      {/* Animated Text rendered as Markdown */}
      <div className={`prose prose-base max-w-none prose-p:leading-[1.8] prose-p:mb-12 prose-headings:font-bold prose-headings:mb-8 prose-headings:mt-16 prose-ul:mb-12 prose-li:mb-6 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:mb-8 prose-table:border prose-table:border-collapse prose-th:border prose-th:p-2 prose-td:border prose-td:p-2 ${isDarkMode ? 'prose-invert prose-blockquote:border-slate-600 prose-strong:text-slate-100 prose-em:text-slate-300' : 'prose-slate prose-strong:text-gray-900 prose-em:text-gray-600 prose-blockquote:border-gray-300'}`}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {displayedText}
        </ReactMarkdown>
      </div>
      
      {/* Wireframe Concept (Appears below text after typing) */}
      {msg.wireframe && showWireframe && (
        <div className={`relative rounded-xl overflow-hidden shadow-sm border p-6 font-mono text-sm animate-[fadeInUp_0.6s_ease-out_forwards] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <div className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded-md uppercase font-semibold tracking-wider ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
            Wireframe Concept
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">
            {msg.wireframe}
          </pre>
        </div>
      )}
    </div>
  );
};


export default function Home() {
  // Start with an empty chat to show the new empty state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingState, setThinkingState] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  useEffect(() => {
    // Only auto scroll initially or when sending a message
    if (!showScrollButton) {
      scrollToBottom();
    }
    
    // Listen for custom event from typing animation
    const handleChatUpdate = () => {
      // Only auto-scroll while typing if they are already at the bottom
      if (!showScrollButton) {
        scrollToBottom();
      }
    };
    window.addEventListener('chat-updated', handleChatUpdate);
    return () => window.removeEventListener('chat-updated', handleChatUpdate);
  }, [messages, isTyping, showScrollButton]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If we scroll up more than 100px from the bottom, show the button
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isScrolledUp);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const stopOutput = () => {
    if (!isTyping) return;
    setIsStopping(true);
    setIsTyping(false);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setThinkingState("");
    setMessages(prev => prev.map(msg => msg.isTypingEffect ? { ...msg, isTypingEffect: false } : msg));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Reset textarea height instantly using querySelector
    const textarea = document.getElementById("main-chat-input") as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = "44px"; // Default min-height
    }

    setIsTyping(true);
    setThinkingState("Reading your idea...");
    setIsStopping(false);
    abortControllerRef.current = new AbortController();

    // Simulate human thinking phases
    setTimeout(() => setThinkingState("Thinking about the market..."), 1200);
    setTimeout(() => setThinkingState("Figuring out next steps..."), 2500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat Idea", idea: userMsg.content, category: "general", tone: "friendly" }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || "Failed to analyze idea");
      }

      // Format text response beautifully using Markdown
      const aiResponseText = data.message;

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: aiResponseText,
        wireframe: data.visualConcept.wireframe,
        isTypingEffect: true // Flag to trigger animation
      }]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error(error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Sorry, I ran into an error processing that. Please try again." }]);
    } finally {
      abortControllerRef.current = null;
      setIsTyping(false);
      setIsStopping(false);
    }
  };

  const InputForm = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize logic extracted into a function
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto"; // Reset height first
        textarea.style.height = `${Math.min(textarea.scrollHeight, 250)}px`; // Set to scrollHeight up to 250px max
      }
    };

    // Run adjust height whenever input changes or component mounts
    useEffect(() => {
      adjustHeight();
    }, [input]);

    return (
      <div className="w-full relative flex flex-col items-center">
        <form 
          onSubmit={handleSend} 
          className="w-full relative flex items-end bg-[#f4f4f4] rounded-3xl p-2 focus-within:ring-1 focus-within:ring-gray-300 transition-all border border-transparent focus-within:border-gray-200"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tell me your idea..."
            className="w-full max-h-[250px] py-3 px-2 bg-transparent text-gray-900 placeholder-gray-500 outline-none resize-none leading-relaxed overflow-y-auto"
            rows={1}
            style={{ minHeight: "44px" }}
          />

          
          <div className="flex items-center gap-2 mb-1 shrink-0 px-1">
            <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors hidden sm:block">
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                !input.trim() || isTyping 
                  ? 'bg-gray-300 text-gray-500' 
                  : 'bg-black text-white hover:opacity-80'
              }`}
            >
              <ArrowUp className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2 mb-1">
          I'm here to help, but double-check important details.
        </p>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className={`flex h-screen overflow-hidden font-sans ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-gray-900'}`}>
      
      {/* LEFT SIDEBAR: History & Profile */}
      <aside className={`w-[260px] flex flex-col hidden md:flex shrink-0 border-r ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f9f9f9] border-gray-200'}`}>
        
        {/* Top Sidebar Actions: Profile and New Chat */}
        <div className="h-14 flex items-center justify-between px-4 pt-2">
          {/* Profile at the top */}
          <button className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-200'}`}>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              R
            </div>
            <span className={`font-medium text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>Rabil</span>
          </button>

          {/* New Chat Button */}
          <button onClick={startNewChat} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`} title="New chat">
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-1">
          <p className={`px-3 text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Today</p>
          <button className={`w-full flex items-center px-3 py-2 text-sm rounded-lg text-left ${isDarkMode ? 'text-slate-200 bg-slate-800' : 'text-gray-900 bg-gray-200'}`}>
            <span className="truncate">AI Gardening Assistant</span>
          </button>
          
          <p className={`px-3 text-xs font-semibold mt-6 mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Previous 7 Days</p>
          <button className={`w-full flex items-center px-3 py-2 text-sm transition-colors text-left ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-600 hover:bg-gray-200'}`}>
            <span className="truncate">Uber for Dog Walkers</span>
          </button>
          <button className={`w-full flex items-center px-3 py-2 text-sm transition-colors text-left ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-600 hover:bg-gray-200'}`}>
            <span className="truncate">Smart Recipe App</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col min-w-0 relative ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        
        {/* TOP HORIZONTAL PANEL */}
        <header className={`h-14 flex items-center px-4 sticky top-0 shrink-0 z-10 ${isDarkMode ? 'bg-black border-b border-slate-800' : 'bg-white border-b border-gray-200'}`}>
          <button className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-900 bg-black text-slate-100' : 'hover:bg-gray-100 bg-white text-gray-900'}`}>
            <span className="text-lg font-medium">Shapper</span>
            <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to night mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Mode
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {messages.length === 0 ? (
            // EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto mb-20">

              <h2 className={`text-3xl font-medium mb-8 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>What's your idea?</h2>
              <div className="w-full relative flex flex-col items-center">
                <form 
                  onSubmit={handleSend} 
                  className={`w-full relative flex items-end rounded-3xl p-2 focus-within:ring-1 transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:ring-slate-600' : 'bg-[#f4f4f4] border-transparent focus-within:ring-gray-300 focus-within:border-gray-200'}`}
                >
                  <textarea
                    id="main-chat-input"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 250)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Tell me your idea..."
                    className={`w-full py-3 px-2 bg-transparent outline-none resize-none overflow-y-auto leading-relaxed ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-gray-900 placeholder-gray-500'}`}
                    rows={1}
                    style={{ height: "44px", minHeight: "44px", maxHeight: "250px" }}
                  />
                  
                  <div className="flex items-center gap-2 mb-1 shrink-0 px-1">
                    {isTyping && (
                      <button
                        type="button"
                        onClick={stopOutput}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Stop output"
                      >
                        <StopCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button type="button" className={`p-2 rounded-full transition-colors hidden sm:block ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        !input.trim() || isTyping 
                          ? (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-gray-300 text-gray-500')
                          : (isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-black text-white hover:opacity-80')
                      }`}
                    >
                      <ArrowUp className="w-5 h-5" strokeWidth={3} />
                    </button>
                  </div>
                </form>
                <p className={`text-xs mt-2 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  I'm here to help, but double-check important details.
                </p>
              </div>
            </div>
          ) : (
            // CHAT STATE
            <>

              {/* CHAT MESSAGES AREA */}
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 scroll-smooth"
              >
                <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6 pb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1 mr-4 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                          <Hexagon className={`w-4 h-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`} fill="currentColor" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] w-full ${
                        msg.role === 'user' 
                          ? `${isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#f4f4f4] text-gray-900'} rounded-[24px] px-5 py-2.5` 
                          : `${isDarkMode ? 'text-slate-200' : 'text-gray-800'} pt-1`
                      }`}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <AiMessage msg={msg} isDarkMode={isDarkMode} />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* TYPING INDICATOR */}
                  {isTyping && (
                    <div className="flex w-full justify-start">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1 mr-4 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <Hexagon className={`w-4 h-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`} fill="currentColor" />
                      </div>
                      <div className="flex flex-col">
                        <div className={`text-xs font-medium mb-1 animate-pulse ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{thinkingState}</div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${isDarkMode ? 'bg-slate-600' : 'bg-gray-400'}`}></span>
                          <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${isDarkMode ? 'bg-slate-600' : 'bg-gray-400'}`}></span>
                          <span className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-600' : 'bg-gray-400'}`}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* SCROLL TO BOTTOM BUTTON */}
                {showScrollButton && (
                  <div className="sticky bottom-6 flex justify-center w-full pb-4 z-20">
                    <button 
                      onClick={() => {
                        scrollToBottom();
                        setShowScrollButton(false);
                      }}
                      className={`shadow-md rounded-full p-2 transition-all animate-fade-in border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-700' : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* INPUT AREA AT BOTTOM */}
              <div className={`p-4 shrink-0 ${isDarkMode ? 'bg-gradient-to-t from-black via-black to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
                <div className="max-w-3xl mx-auto w-full">
                  <div className="w-full relative flex flex-col items-center">
                    <form 
                      onSubmit={handleSend} 
                      className={`w-full relative flex items-end rounded-3xl p-2 focus-within:ring-1 transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:ring-slate-600' : 'bg-[#f4f4f4] border-transparent focus-within:ring-gray-300 focus-within:border-gray-200'}`}
                    >
                      <textarea
                        id="main-chat-input"
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          // Auto-resize logic attached directly to the onChange event
                          e.target.style.height = "auto";
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 250)}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Tell me your idea..."
                        className={`w-full py-3 px-2 bg-transparent outline-none resize-none overflow-y-auto leading-relaxed ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-gray-900 placeholder-gray-500'}`}
                        rows={1}
                        style={{ height: "44px", minHeight: "44px", maxHeight: "250px" }}
                      />
                      
                      <div className="flex items-center gap-2 mb-1 shrink-0 px-1">
                        {isTyping && (
                          <button
                            type="button"
                            onClick={stopOutput}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Stop output"
                          >
                            <StopCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button type="button" className={`p-2 rounded-full transition-colors hidden sm:block ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}>
                          <Mic className="w-5 h-5" />
                        </button>
                        <button
                          type="submit"
                          disabled={!input.trim() || isTyping}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            !input.trim() || isTyping 
                              ? (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-gray-300 text-gray-500')
                              : (isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-black text-white hover:opacity-80')
                          }`}
                        >
                          <ArrowUp className="w-5 h-5" strokeWidth={3} />
                        </button>
                      </div>
                    </form>
                    <p className={`text-xs mt-2 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                      I'm here to help, but double-check important details.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </>
  );
}

