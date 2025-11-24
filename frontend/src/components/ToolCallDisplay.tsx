/**
 * Component for displaying tool calls (vector DB searches) with expandable details
 */
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card } from './ui/card';
import type { ToolCall } from '@/types';
import { Database, Clock } from 'lucide-react';

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
  const duration = toolCall.startTime && toolCall.endTime
    ? `${toolCall.endTime - toolCall.startTime}ms`
    : 'pending...';

  return (
    <Card className="mb-2 bg-blue-50 border-blue-200">
      <Accordion type="single" collapsible>
        <AccordionItem value="tool-call" className="border-0">
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Vector DB Search</span>
              {toolCall.query && (
                <span className="text-muted-foreground">- {toolCall.query.slice(0, 50)}...</span>
              )}
              <Clock className="h-3 w-3 text-muted-foreground ml-auto" />
              <span className="text-xs text-muted-foreground">{duration}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            {toolCall.results ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Found {toolCall.results.n_results} relevant articles
                </div>
                {toolCall.results.documents[0]?.map((doc, idx) => {
                  const metadata = toolCall.results?.metadatas[0]?.[idx];
                  const distance = toolCall.results?.distances[0]?.[idx];

                  return (
                    <div key={idx} className="border-l-2 border-blue-400 pl-3 py-2">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm">
                          {metadata?.title || `Article ${idx + 1}`}
                        </div>
                        {distance !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            similarity: {(1 - distance).toFixed(3)}
                          </div>
                        )}
                      </div>
                      {metadata?.url && (
                        <a
                          href={metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {metadata.url}
                        </a>
                      )}
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {doc}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading results...</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
