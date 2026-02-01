import { useState, useRef, useEffect, useCallback } from 'react';
import { type AgentEvent } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolExecution[];
  isStreaming?: boolean;
};

export type ToolExecution = {
  id: string;
  name: string;
  input: string;
  output?: string;
  status: 'running' | 'completed' | 'failed';
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = useCallback(() => {
    // In development with Vite proxy, use relative path.
    // In production, you might need a full URL logic.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat`;

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket Connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket Disconnected');
      // Simple reconnect logic with backoff could go here
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the agent server.",
        variant: "destructive"
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AgentEvent;
        handleAgentEvent(data);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const handleAgentEvent = (event: AgentEvent) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];

      // We expect the last message to be an assistant message if we are receiving events
      // If not, or if the last message was fully completed, we might need a new placeholder?
      // Actually, send() creates the user message AND an empty assistant message.
      
      if (!lastMessage || lastMessage.role !== 'assistant') {
         return prev; // Should not happen if flow is correct
      }

      switch (event.type) {
        case 'token':
          lastMessage.content += event.content;
          break;

        case 'tool_start':
          const newTool: ToolExecution = {
            id: Date.now().toString(), // Simple ID generation
            name: event.tool,
            input: event.input,
            status: 'running'
          };
          lastMessage.tools = [...(lastMessage.tools || []), newTool];
          break;

        case 'tool_end':
          if (lastMessage.tools) {
            // Find the last running tool with matching name
            // (Assuming sequential tool execution for now)
            const toolIndex = lastMessage.tools.findLastIndex(t => t.name === event.tool && t.status === 'running');
            if (toolIndex !== -1) {
              lastMessage.tools[toolIndex] = {
                ...lastMessage.tools[toolIndex],
                output: event.output,
                status: 'completed'
              };
            }
          }
          break;

        case 'agent_end':
          lastMessage.isStreaming = false;
          setIsProcessing(false);
          break;

        case 'error':
          lastMessage.content += `\n\n*Error: ${event.error}*`;
          lastMessage.isStreaming = false;
          setIsProcessing(false);
          toast({
            title: "Agent Error",
            description: event.error,
            variant: "destructive"
          });
          break;
      }

      return newMessages;
    });
  };

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Lost",
        description: "Please wait for reconnection...",
        variant: "destructive"
      });
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      tools: [],
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsProcessing(true);

    wsRef.current.send(JSON.stringify({ message: content }));
  }, [toast]);

  return {
    messages,
    sendMessage,
    isConnected,
    isProcessing
  };
}
