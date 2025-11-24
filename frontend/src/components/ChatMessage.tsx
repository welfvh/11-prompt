/**
 * Component for displaying a single chat message with tool calls and reasoning
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from './ui/card';
import { ToolCallDisplay } from './ToolCallDisplay';
import type { ChatMessage as ChatMessageType } from '@/types';
import { User, Bot, Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  devMode?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, devMode = false }) => {
  const [showDebug, setShowDebug] = React.useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return null; // Don't display system messages in the chat
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-[#003D8F]' : 'bg-gray-500'
          }`}>
            {isUser ? (
              <User className="h-5 w-5 text-white" />
            ) : (
              <Bot className="h-5 w-5 text-white" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            {/* Tool calls */}
            {message.metadata?.toolCalls?.map((toolCall, idx) => (
              <ToolCallDisplay key={idx} toolCall={toolCall} />
            ))}

            {/* Reasoning (for GPT-5/o1 models) */}
            {message.metadata?.reasoning && (
              <Card className="p-3 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Reasoning</span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message.metadata.reasoning}
                </div>
              </Card>
            )}

            {/* Main message content */}
            {(message.content || (!isUser && message.role === 'assistant')) && (
              <Card className={`p-4 ${
                isUser
                  ? 'bg-[#003D8F] text-white'
                  : 'bg-white'
              }`}>
                {message.content && (
                  <div className={`prose prose-sm max-w-none ${
                    isUser ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
                {!message.content && !isUser && (
                  <div className="text-sm text-muted-foreground italic">
                    Denkt nach...
                  </div>
                )}
                <div className={`text-xs mt-2 flex items-center gap-2 ${
                  isUser ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {message.timestamp && (
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  )}
                  {message.metadata?.latency && (
                    <span className="font-mono">
                      • {(message.metadata.latency / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* Debug Info (collapsible) */}
            {devMode && message.metadata && (message.metadata.toolCalls || message.metadata.reasoning || message.metadata.latency) && (
              <Card className="p-2 bg-slate-50 border-slate-200">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 w-full"
                >
                  {showDebug ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Debug Info
                </button>
                {showDebug && (
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-700">
                    {message.metadata.model && (
                      <div><span className="font-semibold">Model:</span> {message.metadata.model}</div>
                    )}
                    {message.metadata.toolCalls && message.metadata.toolCalls.length > 0 && (
                      <div>
                        <span className="font-semibold">Tool Calls:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(message.metadata.toolCalls, null, 2)}
                        </pre>
                      </div>
                    )}
                    {message.metadata.reasoning && (
                      <div>
                        <span className="font-semibold">Reasoning:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {message.metadata.reasoning}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
