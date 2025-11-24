/**
 * Type definitions for the 11-prompt application
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: {
    model?: string;
    reasoning?: string;
    toolCalls?: ToolCall[];
    startTime?: number;
    latency?: number;
  };
}

export interface ToolCall {
  tool: string;
  query?: string;
  results?: VectorSearchResult;
  startTime?: number;
  endTime?: number;
}

export interface VectorSearchResult {
  query: string;
  n_results: number;
  documents: string[][];
  metadatas: Array<Array<{
    title?: string;
    url?: string;
    [key: string]: any;
  }>>;
  distances: number[][];
  ids: string[][];
}

export interface PromptConfig {
  id: string;
  name: string;
  version?: string;
  created_at?: string;
  updated_at?: string;
  tone: string;
  behavior: string;
  use_case: string;
  system_prompt: string;
  additional_instructions?: string;
  metadata?: {
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  supports_streaming: boolean;
  default_config?: Record<string, any>;
  config_options?: Record<string, ConfigOption>;
}

export interface ConfigOption {
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  description?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  prompt_id?: string;
  stream?: boolean;
  model_config?: Record<string, any>;
}

export interface StreamEvent {
  type: 'tool_call_start' | 'tool_call_end' | 'content' | 'reasoning' | 'done' | 'error';
  data: any;
}
