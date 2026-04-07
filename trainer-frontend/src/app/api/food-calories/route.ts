import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      image_base64?: string
      mime_type?: string
      user_context?: string
    }

    if (!body.image_base64 || !body.mime_type) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 })
    }

    const backendBase = process.env.BACKEND_URL || "http://localhost:8000"
    const url = `${backendBase.replace(/\/$/, "")}/food/calories`

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const text = await upstream.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // ignore
    }

    if (!upstream.ok) {
      const detail =
        typeof data === "object" && data && "detail" in data
          ? String((data as { detail?: unknown }).detail)
          : upstream.statusText
      return NextResponse.json({ error: detail || "Upstream request failed" }, { status: upstream.status })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

