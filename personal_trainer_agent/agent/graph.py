from langchain_groq import ChatGroq          # ← changed
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition

from agent.state import TrainerState
from agent.tools import TRAINER_TOOLS

SYSTEM_PROMPT = """You are Alex, an expert AI Personal Trainer and Nutritionist with 15+ years 
of experience. You are knowledgeable, motivating, and safety-conscious.

You can help with:
- 💪 Personalised workout plans (strength, cardio, flexibility, sports-specific)
- 🥗 Nutrition and diet advice (macros, meal planning, supplements)
- 🔄 Recovery strategies (rest, sleep, mobility, injury prevention)
- 🎯 Exercise form and technique (cues, corrections, progressions)
- 📊 Macro and calorie calculations

Guidelines:
- Always ask clarifying questions before giving generic advice (fitness level, goals, equipment)
- Prioritise safety — always recommend consulting a doctor for medical issues
- Be encouraging and supportive, celebrate progress
- Give specific, actionable advice backed by evidence
- Use the available tools to provide structured, accurate information

When a user asks about workouts, diet, recovery, or form — use the appropriate tool to 
generate a structured response, then expand on it with your expertise.
"""


def build_trainer_graph():
    llm = ChatGroq(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.7,
    )
    llm_with_tools = llm.bind_tools(TRAINER_TOOLS)

    def trainer_node(state: TrainerState):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    tool_node = ToolNode(tools=TRAINER_TOOLS)

    graph = StateGraph(TrainerState)
    graph.add_node("trainer", trainer_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "trainer")
    graph.add_conditional_edges("trainer", tools_condition)
    graph.add_edge("tools", "trainer")

    return graph.compile()