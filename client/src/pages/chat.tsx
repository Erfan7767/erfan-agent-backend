import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, StopCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { messages, sendMessage, isConnected, isProcessing } = useChat();
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !isConnected || isProcessing) return;
    
    sendMessage(input);
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full h-full relative z-10">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">AI Agent</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background/50 backdrop-blur font-mono font-normal">
              v1.0.0
            </Badge>
          </div>
        </header>

        {/* Messages List */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-6">
          <div className="max-w-3xl mx-auto py-8 min-h-full flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center p-8 mt-20"
                >
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 ring-1 ring-border shadow-xl">
                    <Zap className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">How can I help you?</h2>
                  <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                    I'm an intelligent agent capable of browsing the web, running code, and helping you solve complex problems.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {["Research latest AI trends", "Analyze a Python script", "Summarize tech news", "Debug my code"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          if (textareaRef.current) textareaRef.current.focus();
                        }}
                        className="text-sm p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border transition-all text-left text-muted-foreground hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))
              )}
            </AnimatePresence>
            <div className="h-4" /> {/* Spacer */}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 pb-6 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-end p-2 gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                placeholder="Message the agent..."
                disabled={isProcessing || !isConnected}
                className="min-h-[50px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-3 px-4 text-base scrollbar-hide"
                rows={1}
              />
              
              <Button 
                size="icon"
                disabled={!input.trim() || isProcessing || !isConnected}
                onClick={() => handleSubmit()}
                className={cn(
                  "h-10 w-10 mb-1 rounded-xl transition-all duration-300",
                  input.trim() ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"
                )}
              >
                {isProcessing ? (
                  <StopCircle className="h-5 w-5 animate-pulse" />
                ) : (
                  <Send className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50">
                AI Agent • Powered by LangGraph
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
