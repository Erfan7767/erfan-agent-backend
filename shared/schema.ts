import { z } from "zod";

// WebSocket Event Types
export const WS_EVENTS = {
  USER_MESSAGE: 'user_message',
  AGENT_EVENT: 'agent_event',
} as const;

// Types for the Agent events coming from Python
export type AgentEvent = 
  | { type: 'token'; content: string }
  | { type: 'tool_start'; tool: string; input: string }
  | { type: 'tool_end'; tool: string; output: string }
  | { type: 'agent_end'; output: string }
  | { type: 'error'; error: string };

export type WsMessage = {
  type: string;
  data: AgentEvent;
};
