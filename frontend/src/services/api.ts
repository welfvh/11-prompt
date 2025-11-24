/**
 * API service for communicating with the backend
 */
import type { ChatMessage, PromptConfig, ModelConfig, ChatRequest, StreamEvent } from '@/types';

// Use environment variable for API base URL, fallback to relative path
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiService {
  /**
   * Stream chat messages with SSE
   */
  static async *streamChat(
    messages: ChatMessage[],
    model: string,
    promptId?: string,
    modelConfig?: Record<string, any>
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        prompt_id: promptId || 'default',
        stream: true,
        model_config: modelConfig || {},
      } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);

            yield {
              type: eventType as StreamEvent['type'],
              data: eventData,
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * List all prompt configurations
   */
  static async listPrompts(): Promise<PromptConfig[]> {
    const response = await fetch(`${API_BASE}/prompts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get a specific prompt configuration
   */
  static async getPrompt(id: string): Promise<PromptConfig> {
    const response = await fetch(`${API_BASE}/prompts/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Create a new prompt configuration
   */
  static async createPrompt(config: PromptConfig): Promise<any> {
    const response = await fetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Update an existing prompt configuration
   */
  static async updatePrompt(id: string, config: PromptConfig): Promise<any> {
    const response = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Delete a prompt configuration
   */
  static async deletePrompt(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * List available models
   */
  static async listModels(): Promise<{ models: ModelConfig[] }> {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get vector database statistics
   */
  static async getVectorStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/vector/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Search the vector database
   */
  static async searchVector(query: string, nResults: number = 5): Promise<any> {
    const response = await fetch(`${API_BASE}/vector/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, n_results: nResults }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}
