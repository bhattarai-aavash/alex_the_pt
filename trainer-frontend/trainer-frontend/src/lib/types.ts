export type Role = "user" | "assistant"
export type Topic = "workouts" | "nutrition" | "recovery" | "form"

export type Message = {
  id: string
  role: Role
  content: string
  timestamp: Date
  isTyping?: boolean
}

