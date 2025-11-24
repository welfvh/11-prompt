import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return new Date().toLocaleTimeString();
  return new Date(timestamp).toLocaleTimeString();
}

export function parseSSE(data: string): { event: string; data: any } | null {
  const lines = data.split('\n');
  let event = '';
  let eventData = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      eventData = line.substring(5).trim();
    }
  }

  if (event && eventData) {
    try {
      return {
        event,
        data: JSON.parse(eventData)
      };
    } catch (e) {
      console.error('Error parsing SSE data:', e);
    }
  }

  return null;
}
