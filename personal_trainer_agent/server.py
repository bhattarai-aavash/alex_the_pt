"""
FastAPI server that wraps the LangGraph Personal Trainer agent.
Run with: uvicorn server:app --reload --port 8000
"""

import os
import base64
import json
import logging
import time
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal, Any
from langchain_core.messages import HumanMessage, AIMessage

from agent import build_trainer_graph
from langchain_groq import ChatGroq

app = FastAPI(title="Personal Trainer API", version="1.0.0")

logger = logging.getLogger("personal_trainer_api")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# Allow Next.js dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build graph once at startup
graph = build_trainer_graph()

MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))  # 5MB default
ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "60"))

# Naive in-memory rate limiter (guardrail for local/dev usage)
_rate_window_start = defaultdict(lambda: 0.0)
_rate_count = defaultdict(lambda: 0)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if RATE_LIMIT_RPM <= 0:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_s = 60.0
    start = _rate_window_start[client_ip]

    if now - start >= window_s:
        _rate_window_start[client_ip] = now
        _rate_count[client_ip] = 0

    _rate_count[client_ip] += 1
    if _rate_count[client_ip] > RATE_LIMIT_RPM:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    return await call_next(request)


def _safe_detail(message: str) -> str:
    # Guardrail: never leak internal stack traces to clients
    return message if isinstance(message, str) else "Request failed"

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
VISION_TIMEOUT_S = float(os.getenv("VISION_TIMEOUT_S", "45"))


def _vision_llm() -> ChatGroq:
    # Uses GROQ_API_KEY from environment (same as the main agent).
    return ChatGroq(model=VISION_MODEL, temperature=0.2, timeout=VISION_TIMEOUT_S)


def _vision_calorie_estimate(image_data_url: str, prompt: str) -> str:
    system = (
        "You are a nutrition assistant. You estimate calories from food images.\n"
        "Return ONLY valid JSON matching this schema:\n"
        "{"
        '"items":[{"name":string,"estimated_calories":number,"notes":string}],'
        '"total_calories":number,'
        '"assumptions":[string],'
        '"confidence":"low"|"medium"|"high",'
        '"safety_note":string'
        "}\n"
        "If the image is not food, or you cannot tell, set confidence to low and explain in safety_note."
    )

    msg = HumanMessage(
        content=[
            {"type": "text", "text": f"{system}\n\n{prompt}"},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]
    )
    resp = _vision_llm().invoke([msg])
    return str(resp.content).strip()


def _extract_json_object(text: str) -> str:
    """
    Guardrail: models sometimes wrap JSON in markdown fences or add prose.
    This extracts the first top-level JSON object substring.
    """
    s = (text or "").strip()
    if not s:
        raise ValueError("Empty model output")

    # Strip common markdown code fences
    if s.startswith("```"):
        lines = s.splitlines()
        # drop opening fence (``` or ```json)
        if lines:
            lines = lines[1:]
        # drop closing fence if present
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()

    # Find first '{' and then bracket-match to end of JSON object
    start = s.find("{")
    if start == -1:
        raise ValueError("No JSON object start found")

    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return s[start : i + 1]

    raise ValueError("Unterminated JSON object in model output")


class FoodCaloriesRequest(BaseModel):
    image_base64: str
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    user_context: Optional[str] = None  # e.g. "this is chicken momo, 10 pieces"


class FoodItemEstimate(BaseModel):
    name: str
    estimated_calories: float
    notes: str


class FoodCaloriesResponse(BaseModel):
    items: List[FoodItemEstimate]
    total_calories: float
    assumptions: List[str]
    confidence: Literal["low", "medium", "high"]
    safety_note: str
    assistant_message: Optional[str] = None


def _format_calorie_estimate_as_alex(estimate: "FoodCaloriesResponse") -> str:
    llm = ChatGroq(model=VISION_MODEL, temperature=0.4, timeout=VISION_TIMEOUT_S)
    system = (
        "You are Alex, an expert AI Personal Trainer and Nutritionist.\n"
        "You are safety-conscious and practical.\n"
        "Given a structured calorie estimate (JSON), produce a helpful response in Markdown.\n"
        "Requirements:\n"
        "- Start with a one-line total calorie estimate.\n"
        "- Provide a short breakdown list.\n"
        "- Include 2-3 practical tips to reduce/increase calories depending on likely goal.\n"
        "- If confidence is low/medium, explicitly say it's an estimate.\n"
        "- Keep it concise.\n"
        "- Do NOT include code fences.\n"
    )

    payload = estimate.model_dump(exclude={"assistant_message"})
    msg = HumanMessage(content=f"{system}\n\nCalorie estimate JSON:\n{json.dumps(payload, ensure_ascii=False)}")
    resp = llm.invoke([msg])
    return str(resp.content).strip()


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "agent": "Personal Trainer Alex"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Convert to LangChain message objects
    lc_messages = []
    for msg in request.messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))

    if not lc_messages:
        raise HTTPException(status_code=400, detail="No valid messages")

    try:
        result = graph.invoke({"messages": lc_messages})
        last_message = result["messages"][-1]
        return ChatResponse(message=last_message.content)
    except Exception as e:
        logger.exception("Chat failure")
        raise HTTPException(status_code=500, detail=_safe_detail("Internal server error"))


@app.post("/food/calories", response_model=FoodCaloriesResponse)
async def food_calories(request: FoodCaloriesRequest):
    if request.mime_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    # Basic guardrails: decode + size limit
    try:
        raw = base64.b64decode(request.image_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large (max {MAX_IMAGE_BYTES} bytes)")

    # Data URL format for online multimodal models (OpenAI-compatible)
    image_b64 = base64.b64encode(raw).decode("utf-8")
    image_data_url = f"data:{request.mime_type};base64,{image_b64}"

    user_hint = (request.user_context or "").strip()
    prompt = (
        "Estimate calories for the meal in the image. Break down items and give a total. "
        "Include assumptions about portion size, cooking oil, sauces, and packaging. "
        "Prefer ranges internally but output single best estimates.\n"
    )
    if user_hint:
        prompt += f"User context: {user_hint}\n"

    try:
        content = _vision_calorie_estimate(image_data_url=image_data_url, prompt=prompt)
        # Guardrail: accept only valid JSON output; otherwise fail closed with helpful message
        parsed: Any = json.loads(_extract_json_object(content))
        estimate = FoodCaloriesResponse.model_validate(parsed)
        try:
            estimate.assistant_message = _format_calorie_estimate_as_alex(estimate)
        except Exception:
            logger.exception("Failed to format calorie estimate")
        return estimate
    except json.JSONDecodeError:
        logger.warning("Non-JSON model output: %s", content[:500])
        raise HTTPException(
            status_code=502,
            detail="Vision model returned an invalid response.",
        )
    except ValueError:
        logger.warning("Could not extract JSON: %s", content[:500])
        raise HTTPException(status_code=502, detail="Vision model returned an invalid response.")
    except Exception as e:
        # Guardrail: common misconfigurations become actionable, non-leaky errors
        msg = str(e)
        if "GROQ_API_KEY" in msg or "api key" in msg.lower():
            raise HTTPException(status_code=503, detail="Groq API key is not configured (set GROQ_API_KEY).")
        logger.exception("Food calories failure")
        raise HTTPException(status_code=500, detail=_safe_detail("Internal server error"))