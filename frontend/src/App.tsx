/**
 * Main application - improved layout with dev mode
 */
import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PromptEditor } from './components/PromptEditor';
import { ModelSelector } from './components/ModelSelector';
import { DevModePanel } from './components/DevModePanel';
import type { ModelConfig } from './types';
import { Settings, Code } from 'lucide-react';
import { Button } from './components/ui/button';

function App() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('default');
  const [modelConfig, setModelConfig] = useState<Record<string, any>>({});
  const [devMode, setDevMode] = useState<boolean>(true); // Dev mode on by default
  const [devLogs, setDevLogs] = useState<any[]>([]);

  const addDevLog = (log: any) => {
    setDevLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }]);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">11-Prompt Testumgebung</h1>
              <p className="text-sm text-slate-600">
                Testen und optimieren Sie Ihre Chatbot-Prompts
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={devMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDevMode(!devMode)}
                className={devMode ? "bg-[#003D8F] hover:bg-[#002a63]" : ""}
              >
                <Code className="h-4 w-4 mr-2" />
                Dev Mode
              </Button>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                modelConfig={modelConfig}
                onConfigChange={setModelConfig}
                compact
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left - Prompt Configuration (independent scroll) */}
          <div className="flex flex-col h-full overflow-hidden">
            <PromptEditor
              selectedPromptId={selectedPromptId}
              onPromptChange={setSelectedPromptId}
              onPromptUpdated={() => {}}
            />
          </div>

          {/* Right - Chat Interface (independent scroll) */}
          <div className="flex flex-col h-full overflow-hidden">
            <ChatInterface
              selectedModel={selectedModel}
              selectedPromptId={selectedPromptId}
              modelConfig={modelConfig}
              onDevLog={addDevLog}
              devMode={devMode}
            />
          </div>
        </div>
      </main>

      {/* Dev mode is now inline in chat messages - no separate panel needed */}
    </div>
  );
}

export default App;
