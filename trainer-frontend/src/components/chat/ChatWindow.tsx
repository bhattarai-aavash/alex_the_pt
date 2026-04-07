"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatInput } from "@/components/chat/ChatInput"
import { QuickPrompts } from "@/components/chat/QuickPrompts"
import { Sidebar } from "@/components/chat/Sidebar"
import { type Message, type Topic } from "@/lib/types"
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
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    const typingMsg: Message = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }

    const history: { role: "user" | "assistant"; content: string }[] = [
      ...messagesRef.current,
      userMsg,
    ]
      .filter((m) => !m.isTyping)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg, typingMsg])
    setIsLoading(true)

    try {
      if (history.length === 0) {
        throw new Error("No messages provided")
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error || "Request failed")
      }

      const data = (await res.json()) as { message?: string }

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.message || "",
        timestamp: new Date(),
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(assistantMsg))
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      }
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const analyzeFoodImage = useCallback(async (file: File) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"])
    const maxBytes = 5 * 1024 * 1024
    if (!allowed.has(file.type)) {
      setMessages((prev) =>
        prev.concat({
          id: generateId(),
          role: "assistant",
          content: "⚠️ Please upload a JPG, PNG, or WEBP image.",
          timestamp: new Date(),
        })
      )
      return
    }
    if (file.size > maxBytes) {
      setMessages((prev) =>
        prev.concat({
          id: generateId(),
          role: "assistant",
          content: "⚠️ Image is too large (max 5MB).",
          timestamp: new Date(),
        })
      )
      return
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: "Estimate calories from this food photo.",
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
      const image_base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.onload = () => {
          const res = String(reader.result || "")
          const idx = res.indexOf("base64,")
          if (idx === -1) return reject(new Error("Invalid image data"))
          resolve(res.slice(idx + "base64,".length))
        }
        reader.readAsDataURL(file)
      })

      const res = await fetch("/api/food-calories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64,
          mime_type: file.type,
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error || "Request failed")
      }

      const data = (await res.json()) as {
        items: { name: string; estimated_calories: number; notes: string }[]
        total_calories: number
        assumptions: string[]
        confidence: "low" | "medium" | "high"
        safety_note: string
        assistant_message?: string
      }

      const content = (() => {
        if (data.assistant_message?.trim()) return data.assistant_message

        const lines: string[] = []
        lines.push(`**Estimated total:** ${Math.round(data.total_calories)} kcal`)
        lines.push(`**Confidence:** ${data.confidence}`)
        lines.push("")
        lines.push("**Breakdown:**")
        for (const item of data.items || []) {
          lines.push(`- ${item.name}: ~${Math.round(item.estimated_calories)} kcal (${item.notes})`)
        }
        if (data.assumptions?.length) {
          lines.push("")
          lines.push("**Assumptions:**")
          for (const a of data.assumptions) lines.push(`- ${a}`)
        }
        if (data.safety_note) {
          lines.push("")
          lines.push(`**Note:** ${data.safety_note}`)
        }
        return lines.join("\n")
      })()

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== "typing")
          .concat({
            id: generateId(),
            role: "assistant",
            content,
            timestamp: new Date(),
          })
      )
    } catch (err: unknown) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== "typing")
          .concat({
            id: generateId(),
            role: "assistant",
            content: `⚠️ Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
            timestamp: new Date(),
          })
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleClear = () => {
    setMessages([])
    setIsLoading(false)
    setActiveTopic(null)
  }

  const topicStarterPrompts: Record<Topic, string> = {
    workouts: "Build me a 4-day weekly workout plan for muscle gain with 45-minute sessions.",
    nutrition: "Create a high-protein meal plan for fat loss with simple grocery-friendly foods.",
    recovery: "Give me a 7-day recovery routine to reduce soreness and improve sleep quality.",
    form: "Coach my squat form: common mistakes, cues, warmups, and drills to fix knee cave.",
  }

  const topicPlaceholders: Record<Topic, string> = {
    workouts: "Tell Alex your goal, level, days/week, and available equipment…",
    nutrition: "Share your goal, weight, activity level, and food preferences…",
    recovery: "Describe soreness, sleep, training intensity, and stress level…",
    form: "Which exercise and what form issue are you facing?",
  }

  const handleTopicSelect = useCallback(
    (topic: Topic) => {
      setActiveTopic(topic)
      if (!isLoading) {
        void sendMessage(topicStarterPrompts[topic])
      }
    },
    [isLoading, sendMessage]
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        onNewChat={handleClear}
        messageCount={messages.filter((m) => !m.isTyping).length}
        activeTopic={activeTopic}
        onSelectTopic={handleTopicSelect}
      />

      <div className="flex flex-1 flex-col min-w-0">
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

        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto" onScroll={handleScroll}>
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

          {showScrollBtn && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className={cn(
                "absolute bottom-4 right-4 z-10",
                "h-8 w-8 rounded-full border border-border bg-card shadow-lg",
                "flex items-center justify-center text-muted-foreground",
                "hover:text-foreground hover:border-amber-400/40 transition-all duration-200"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>

        <ChatInput
          onSend={sendMessage}
          onAnalyzeFoodImage={analyzeFoodImage}
          isLoading={isLoading}
          placeholder={activeTopic ? topicPlaceholders[activeTopic] : undefined}
        />
      </div>
    </div>
  )
}

