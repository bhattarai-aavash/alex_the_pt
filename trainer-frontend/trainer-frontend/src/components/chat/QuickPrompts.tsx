"use client"

import { Button } from "@/components/ui/button"

const PROMPTS = [
  "Build me a 3-day full-body workout for fat loss.",
  "What should I eat pre-workout and post-workout?",
  "My knees hurt when I squat—help me fix my form.",
  "How do I recover faster and avoid soreness?",
]

export function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          Quick start
        </h2>
        <p className="mt-2 text-2xl font-semibold tracking-tight">Ask Alex anything fitness.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PROMPTS.map((p) => (
            <Button
              key={p}
              type="button"
              variant="outline"
              className="h-auto justify-start whitespace-normal text-left"
              onClick={() => onSelect(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

