import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage

load_dotenv()

from agent import build_trainer_graph


def main():
    print("\n" + "="*55)
    print("🏋️  Welcome to Your AI Personal Trainer — Alex!")
    print("="*55)
    print("Ask me about: workouts, diet, recovery, or form.")
    print("Type 'quit' or 'exit' to end the session.\n")

    graph = build_trainer_graph()
    conversation_history = []

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n👋 Stay consistent — see you next session!")
            break

        if not user_input:
            continue

        if user_input.lower() in {"quit", "exit", "bye"}:
            print("\n👋 Great work today! Stay consistent and keep pushing!")
            break

        conversation_history.append(HumanMessage(content=user_input))

        try:
            result = graph.invoke({"messages": conversation_history})
            conversation_history = result["messages"]

            # Get the last AI message
            last_message = conversation_history[-1]
            print(f"\nAlex: {last_message.content}\n")

        except Exception as e:
            print(f"\n⚠️  Error: {e}\n")
            print("Please try again.\n")


if __name__ == "__main__":
    main()