"use client"

import { Dumbbell, Salad, RefreshCw, Target, Trash2, Plus, Activity } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  onNewChat: () => void
  messageCount: number
}

const NAV_ITEMS = [
  { icon: Dumbbell,  label: "Workouts",  color: "text-amber-400",  bg: "bg-amber-400/10"  },
  { icon: Salad,     label: "Nutrition", color: "text-green-400",  bg: "bg-green-400/10"  },
  { icon: RefreshCw, label: "Recovery",  color: "text-blue-400",   bg: "bg-blue-400/10"   },
  { icon: Target,    label: "Form",      color: "text-purple-400", bg: "bg-purple-400/10" },
]

export function Sidebar({ onNewChat, messageCount }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/30">
          <Dumbbell className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="font-display font-bold text-lg uppercase tracking-wider text-amber-400 leading-none">
            Alex
          </p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">AI Personal Trainer</p>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-4 pb-2">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 border-dashed border-border hover:border-amber-400/40 hover:bg-amber-400/5 hover:text-amber-400 text-muted-foreground font-display uppercase tracking-wide text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New Session
        </Button>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Topics */}
      <div className="px-3 py-3">
        <p className="px-2 mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
          Topics
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, color, bg }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 group"
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </span>
              <span className="font-body font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Session Stats */}
      <div className="px-3 py-3">
        <p className="px-2 mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
          Session
        </p>
        <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-body">Messages</span>
            <span className="text-xs font-mono font-bold text-amber-400">{messageCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-body">Model</span>
            <span className="text-xs font-mono text-green-400">LLaMA 3.3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-body">Status</span>
            <span className="flex items-center gap-1 text-xs font-mono text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono">
            Powered by Groq + LangGraph
          </span>
        </div>
      </div>
    </aside>
  )
}
