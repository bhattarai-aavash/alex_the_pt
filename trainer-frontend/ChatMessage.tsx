"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { type Message } from "@/lib/types"

interface ChatMessageProps {
  message: Message
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-amber-400 opacity-80" />
      <span className="typing-dot h-2 w-2 rounded-full bg-amber-400 opacity-80" />
      <span className="typing-dot h-2 w-2 rounded-full bg-amber-400 opacity-80" />
    </div>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "message-enter flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <Avatar className="h-8 w-8 border border-amber-400/40">
            <AvatarFallback className="bg-amber-400/10 text-amber-400 text-xs font-bold font-display">
              YOU
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="h-8 w-8 border border-green-500/40">
            <AvatarFallback className="bg-green-500/10 text-green-400 text-xs font-bold font-display">
              ALEX
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-amber-400/10 border border-amber-400/20 text-foreground ml-auto"
            : "rounded-tl-sm bg-card border border-border text-foreground"
        )}
      >
        {/* Top accent line for Alex */}
        {!isUser && (
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-green-500/40 via-green-400/20 to-transparent rounded-full" />
        )}

        {message.isTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-trainer">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        {!message.isTyping && (
          <p className={cn(
            "mt-1.5 text-[10px] font-mono opacity-40",
            isUser ? "text-right" : "text-left"
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  )
}
