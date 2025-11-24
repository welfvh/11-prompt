/**
 * Dev mode panel for debugging API calls and responses
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface DevModePanelProps {
  logs: any[];
  onClear: () => void;
  onClose: () => void;
}

export const DevModePanel: React.FC<DevModePanelProps> = ({ logs, onClear, onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl" style={{ height: '40vh' }}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-bold">Dev Mode - API Logs ({logs.length})</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClear}>
              <Trash2 className="h-4 w-4 mr-1" />
              Löschen
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Logs bisher. Senden Sie eine Nachricht im Chat.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="border rounded p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${
                      log.type === 'request' ? 'text-blue-600' :
                      log.type === 'response' ? 'text-green-600' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {log.type?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
