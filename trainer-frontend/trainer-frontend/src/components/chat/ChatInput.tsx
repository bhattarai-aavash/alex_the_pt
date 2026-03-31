"use client"

import { useMemo, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImagePlus } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>
  onAnalyzeFoodImage: (file: File) => void | Promise<void>
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({ onSend, onAnalyzeFoodImage, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const canSend = useMemo(() => value.trim().length > 0 && !isLoading, [value, isLoading])

  const submit = async () => {
    const content = value.trim()
    if (!content || isLoading) return
    setValue("")
    await onSend(content)
  }

  return (
    <div className="border-t border-border bg-card/30 backdrop-blur-sm p-4 flex-shrink-0">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            e.currentTarget.value = ""
            void onAnalyzeFoodImage(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-[44px] px-3"
          disabled={isLoading}
          onClick={() => fileRef.current?.click()}
          title="Estimate calories from a food photo"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || "Ask Alex about workouts, nutrition, recovery, or form…"}
          className="min-h-[44px] max-h-40 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          disabled={isLoading}
        />
        <Button onClick={() => void submit()} disabled={!canSend}>
          {isLoading ? "Thinking…" : "Send"}
        </Button>
      </div>
    </div>
  )
}

