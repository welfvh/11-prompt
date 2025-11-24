/**
 * Chat interface with sticky input, reset, and dev mode logging
 */
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ChatMessage } from './ChatMessage';
import { ApiService } from '@/services/api';
import type { ChatMessage as ChatMessageType, ToolCall, ModelConfig } from '@/types';
import { Send, Loader2, Bot, RotateCcw, Copy, Check } from 'lucide-react';

interface ChatInterfaceProps {
  selectedModel: ModelConfig | null;
  selectedPromptId: string;
  modelConfig: Record<string, any>;
  onDevLog?: (log: any) => void;
  devMode?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedModel,
  selectedPromptId,
  modelConfig,
  onDevLog,
  devMode = false,
}) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: 'assistant',
      content: 'Der 1&1 Assistent unterstützt Sie bei all Ihren Fragen zu den 1&1 Produkten und Services.',
      timestamp: new Date().toISOString(),
      metadata: {
        model: selectedModel?.id,
      },
    },
    {
      role: 'assistant',
      content: 'Wobei kann ich Ihnen heute helfen?',
      timestamp: new Date().toISOString(),
      metadata: {
        model: selectedModel?.id,
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const log = (type: string, data: any) => {
    if (onDevLog) {
      onDevLog({ type, data });
    }
    console.log(`[${type.toUpperCase()}]`, data);
  };

  const copyTranscript = async () => {
    const transcript = messages.map((msg, idx) => {
      let text = `[${msg.role.toUpperCase()}]:\n${msg.content}\n`;

      if (devMode && msg.metadata) {
        text += `\n--- DEBUG INFO ---\n`;
        if (msg.metadata.model) text += `Model: ${msg.metadata.model}\n`;
        if (msg.metadata.toolCalls && msg.metadata.toolCalls.length > 0) {
          text += `\nTool Calls:\n${JSON.stringify(msg.metadata.toolCalls, null, 2)}\n`;
        }
        if (msg.metadata.reasoning) text += `\nReasoning:\n${msg.metadata.reasoning}\n`;
        text += `------------------\n`;
      }

      return text;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    if (confirm('Chat zurücksetzen? Alle Nachrichten werden gelöscht.')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Der 1&1 Assistent unterstützt Sie bei all Ihren Fragen zu den 1&1 Produkten und Services.',
          timestamp: new Date().toISOString(),
          metadata: {
            model: selectedModel?.id,
          },
        },
        {
          role: 'assistant',
          content: 'Wobei kann ich Ihnen heute helfen?',
          timestamp: new Date().toISOString(),
          metadata: {
            model: selectedModel?.id,
          },
        },
      ]);
      setInput('');
      log('reset', { message: 'Chat reset by user' });
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || !selectedModel) return;

    const userMessage: ChatMessageType = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messagesCopy = [...messages, userMessage];
    setInput('');
    setIsLoading(true);

    log('request', {
      model: selectedModel.id,
      prompt_id: selectedPromptId,
      message: textToSend,
      model_config: modelConfig,
    });

    let assistantContent = '';
    const toolCalls: ToolCall[] = [];
    let reasoning = '';
    const startTime = Date.now();

    // Create assistant message placeholder immediately
    const assistantMessage: ChatMessageType = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      metadata: {
        model: selectedModel.id,
        toolCalls: [],
        startTime,
      },
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = ApiService.streamChat(
        messagesCopy,
        selectedModel.id,
        selectedPromptId,
        modelConfig
      );

      for await (const event of stream) {
        log('stream_event', event);

        switch (event.type) {
          case 'tool_call_start':
            const newToolCall: ToolCall = {
              tool: event.data.tool,
              query: event.data.query,
              startTime: Date.now(),
            };
            toolCalls.push(newToolCall);

            // Update message with tool call immediately
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              if (newMessages[lastIdx] && newMessages[lastIdx].role === 'assistant') {
                newMessages[lastIdx] = {
                  ...newMessages[lastIdx],
                  metadata: {
                    ...newMessages[lastIdx].metadata,
                    toolCalls: [...toolCalls],
                  },
                };
              }
              return newMessages;
            });
            break;

          case 'tool_call_end':
            const lastToolCall = toolCalls[toolCalls.length - 1];
            if (lastToolCall) {
              lastToolCall.results = event.data.results;
              lastToolCall.endTime = Date.now();

              // Update message with completed tool call
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (newMessages[lastIdx] && newMessages[lastIdx].role === 'assistant') {
                  newMessages[lastIdx] = {
                    ...newMessages[lastIdx],
                    metadata: {
                      ...newMessages[lastIdx].metadata,
                      toolCalls: [...toolCalls],
                    },
                  };
                }
                return newMessages;
              });
            }
            break;

          case 'reasoning':
            reasoning = event.data.content;
            break;

          case 'content':
            assistantContent += event.data.delta;
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              if (newMessages[lastIdx] && newMessages[lastIdx].role === 'assistant') {
                newMessages[lastIdx] = {
                  ...newMessages[lastIdx],
                  content: assistantContent,
                  metadata: {
                    ...newMessages[lastIdx].metadata,
                    toolCalls: [...toolCalls],
                    reasoning: reasoning || undefined,
                  },
                };
              }
              return newMessages;
            });
            break;

          case 'done':
            const endTime = Date.now();
            const latency = endTime - startTime;

            // Update final message with latency
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastIdx = newMessages.length - 1;
              if (newMessages[lastIdx] && newMessages[lastIdx].role === 'assistant') {
                newMessages[lastIdx] = {
                  ...newMessages[lastIdx],
                  metadata: {
                    ...newMessages[lastIdx].metadata,
                    latency,
                  },
                };
              }
              return newMessages;
            });

            log('response', {
              content: assistantContent,
              tool_calls: toolCalls,
              reasoning,
              latency,
            });
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.data);
            log('error', event.data);
            setIsLoading(false);
            break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      log('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Chat</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyTranscript}
              disabled={messages.length <= 2}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Kopieren
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={messages.length <= 2}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Zurücksetzen
            </Button>
          </div>
        </div>
        {selectedModel && (
          <div className="text-sm text-muted-foreground">
            Modell: {selectedModel.name}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Scrollable messages area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          <div className="flex flex-col h-full">
            <div className={messages.length === 2 ? "flex-1" : ""}>
              {messages.map((message, idx) => (
                <ChatMessage key={idx} message={message} devMode={devMode} />
              ))}
            </div>
            {messages.length === 2 && (
              <div className="flex justify-end gap-2 pb-4 px-6">
                <button
                  onClick={() => handleSend('eSIM')}
                  disabled={!selectedModel || isLoading}
                  className="px-4 py-2 bg-[#E7ECF4] hover:bg-[#d0d7e3] text-gray-700 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  eSIM
                </button>
                <button
                  onClick={() => handleSend('Service PIN')}
                  disabled={!selectedModel || isLoading}
                  className="px-4 py-2 bg-[#E7ECF4] hover:bg-[#d0d7e3] text-gray-700 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Service PIN
                </button>
                <button
                  onClick={() => handleSend('Störung')}
                  disabled={!selectedModel || isLoading}
                  className="px-4 py-2 bg-[#E7ECF4] hover:bg-[#d0d7e3] text-gray-700 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Störung
                </button>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Sticky input area */}
        <div className="flex-shrink-0 border-t bg-white p-4">
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedModel
                  ? "Nachricht eingeben... (Shift+Enter für neue Zeile)"
                  : "Modell auswählen um zu starten"
              }
              className="resize-none flex-1"
              rows={3}
              disabled={!selectedModel || isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !selectedModel || isLoading}
              size="icon"
              className="h-[76px] w-[76px] bg-[#003D8F] hover:bg-[#002a63] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
