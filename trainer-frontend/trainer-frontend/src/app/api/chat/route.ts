import { NextResponse } from "next/server"

type IncomingMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: IncomingMessage[] }
    const messages = body.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const backendBase = process.env.BACKEND_URL || "http://localhost:8000"
    const url = `${backendBase.replace(/\/$/, "")}/chat`

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      cache: "no-store",
    })

    const text = await upstream.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // ignore JSON parse errors; we'll fall back to generic message
    }

    if (!upstream.ok) {
      const detail =
        typeof data === "object" && data && "detail" in data
          ? String((data as { detail?: unknown }).detail)
          : upstream.statusText
      return NextResponse.json({ error: detail || "Upstream request failed" }, { status: upstream.status })
    }

    if (typeof data === "object" && data && "message" in data) {
      return NextResponse.json({ message: String((data as { message?: unknown }).message) })
    }

    return NextResponse.json({ error: "Invalid response from backend" }, { status: 502 })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

