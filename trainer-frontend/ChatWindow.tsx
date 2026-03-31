"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { QuickPrompts } from "./QuickPrompts"
import { Sidebar } from "./Sidebar"
import { type Message } from "@/lib/types"
import { Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    const typingMsg: Message = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, userMsg, typingMsg])
    setIsLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Request failed")
      }

      const data = await res.json()

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(assistantMsg))
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ **Error:** ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      }
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const handleClear = () => {
    setMessages([])
    setIsLoading(false)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar onNewChat={handleClear} messageCount={messages.filter(m => !m.isTyping).length} />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-display font-bold uppercase tracking-wider text-sm text-foreground">
              Chat Session
            </span>
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </header>

        {/* Messages area */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            {isEmpty ? (
              <QuickPrompts onSelect={sendMessage} />
            ) : (
              <div className="pb-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom()}
              className={cn(
                "absolute bottom-4 right-4 z-10",
                "h-8 w-8 rounded-full border border-border bg-card shadow-lg",
                "flex items-center justify-center text-muted-foreground",
                "hover:text-foreground hover:border-amber-400/40 transition-all duration-200",
                "animate-fade-in"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
