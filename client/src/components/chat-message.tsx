import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Bot, User, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message, ToolExecution } from '@/hooks/use-chat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 p-4 md:p-6 mb-4 rounded-2xl transition-colors",
        isUser ? "bg-muted/30" : "bg-transparent"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border shadow-sm",
        isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            {isUser ? 'You' : 'Agent'}
          </span>
          
          {/* Tool Executions */}
          {message.tools && message.tools.length > 0 && (
            <div className="flex flex-col gap-2 mb-4 mt-1">
              {message.tools.map((tool) => (
                <ToolDisplay key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Message Content */}
          <div className="markdown-body text-base leading-relaxed text-foreground">
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              message.isStreaming && message.tools?.length === 0 && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
              )
            )}
            {message.isStreaming && message.content && (
              <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1 align-middle" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolDisplay({ tool }: { tool: ToolExecution }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isCompleted = tool.status === 'completed';
  const isFailed = tool.status === 'failed';

  return (
    <Card className="border-border/50 bg-black/20 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 p-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/50",
            tool.status === 'running' && "animate-pulse border-primary/50"
          )}>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-primary uppercase tracking-wider">
                {tool.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {tool.input}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : isFailed ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                {isOpen ? 'Hide' : 'Details'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border/50 bg-black/40 p-3 font-mono text-xs text-muted-foreground overflow-x-auto">
            <div className="mb-2">
              <span className="text-primary/70 select-none">$ input: </span>
              <span className="text-foreground">{tool.input}</span>
            </div>
            {tool.output && (
               <div>
                <span className="text-green-500/70 select-none">{'>'} output: </span>
                <span className="text-foreground/90 whitespace-pre-wrap">{tool.output}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
