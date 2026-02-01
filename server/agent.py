import os
from typing import Annotated, Literal, TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
# from langchain_core.tools import tool # Standard tool decorator
# from e2b_code_interpreter import CodeInterpreter # E2B SDK
# Using a simplified E2B tool wrapper for LangChain if available, or custom
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

# -- Configuration --
# Ideally, these are loaded from env vars:
# ANTHROPIC_API_KEY
# TAVILY_API_KEY
# E2B_API_KEY

# -- Tools --

# 1. Tavily Search
tavily_tool = TavilySearchResults(max_results=3)

# 2. E2B Code Interpreter (Mock/Wrapper for now as we need the SDK installed)
# We will define a custom tool for E2B if the package is present, else mock it or use a simple python REPL
# For the blueprint, we assume e2b-code-interpreter is installed.

from langchain_core.tools import tool

@tool
def python_interpreter(code: str):
    """
    Execute Python code using E2B Code Interpreter.
    Use this tool to run calculations, data analysis, or any python script.
    Input should be valid python code.
    """
    try:
        from e2b_code_interpreter import CodeInterpreter
        print(f"Executing code in E2B sandbox: {code}")
        with CodeInterpreter() as sandbox:
            execution = sandbox.notebook.exec_cell(code)
            if execution.error:
                return f"Error: {execution.error.name}: {execution.error.value}\nTraceback: {execution.error.traceback}"
            return execution.text or str(execution.results)
    except Exception as e:
        return f"Error executing code: {str(e)}"

tools = [tavily_tool, python_interpreter]

# -- LLM --
llm = ChatAnthropic(model="claude-3-5-sonnet-20240620") # Or generic "claude-3-5-sonnet-latest"
llm_with_tools = llm.bind_tools(tools)

# -- Graph State --
class State(TypedDict):
    messages: Annotated[list[BaseMessage], "add_messages"]

# -- Nodes --
def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# -- Graph Construction --
graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools=tools))

graph_builder.add_edge(START, "chatbot")
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge("chatbot", END)

agent_graph = graph_builder.compile()
