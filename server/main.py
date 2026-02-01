import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from server.agent import agent_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message")

            if not user_message:
                continue

            # Stream the graph execution
            # The agent_graph returns a generator of events
            try:
                # Use astream_events or invoke
                # We'll use astream for granular updates
                async for event in agent_graph.astream_events(
                    {"messages": [("user", user_message)]},
                    version="v1"
                ):
                    kind = event["event"]
                    
                    if kind == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            await websocket.send_json({
                                "type": "token",
                                "content": content
                            })
                    
                    elif kind == "on_tool_start":
                        await websocket.send_json({
                            "type": "tool_start",
                            "tool": event["name"],
                            "input": str(event["data"].get("input"))
                        })
                        
                    elif kind == "on_tool_end":
                        await websocket.send_json({
                            "type": "tool_end",
                            "tool": event["name"],
                            "output": str(event["data"].get("output"))
                        })

                await websocket.send_json({"type": "agent_end", "output": ""})

            except Exception as e:
                print(f"Error executing agent: {e}")
                await websocket.send_json({"type": "error", "error": str(e)})

    except WebSocketDisconnect:
        print("Client disconnected")
