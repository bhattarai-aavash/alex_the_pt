from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class TrainerState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_profile: dict  # stores fitness level, goals, etc.