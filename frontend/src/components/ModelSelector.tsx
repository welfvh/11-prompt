/**
 * Component for selecting and configuring AI models
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ApiService } from '@/services/api';
import type { ModelConfig } from '@/types';
import { Brain, Zap, Clock } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ModelConfig | null;
  onModelChange: (model: ModelConfig) => void;
  modelConfig: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  modelConfig,
  onConfigChange,
  compact = false,
}) => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await ApiService.listModels();
      setModels(data.models);

      // Select first model by default
      if (data.models.length > 0 && !selectedModel) {
        onModelChange(data.models[0]);
        onConfigChange(data.models[0].default_config || {});
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (model) {
      onModelChange(model);
      onConfigChange(model.default_config || {});
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    onConfigChange({
      ...modelConfig,
      [key]: value,
    });
  };

  if (isLoading) {
    return compact ? (
      <div className="text-sm text-muted-foreground">Lade Modelle...</div>
    ) : (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lade Modelle...</div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Label htmlFor="model-select-compact" className="text-sm font-medium whitespace-nowrap">
          Modell:
        </Label>
        <Select
          value={selectedModel?.id || ''}
          onValueChange={handleModelSelect}
        >
          <SelectTrigger id="model-select-compact" className="w-[200px]">
            <SelectValue placeholder="Modell wählen" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modell-Auswahl</CardTitle>
        <CardDescription>KI-Modell wählen und Parameter konfigurieren</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-select">AI Model</Label>
          <Select
            value={selectedModel?.id || ''}
            onValueChange={handleModelSelect}
          >
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {model.provider === 'openai' ? (
                      <Brain className="h-4 w-4" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <div className="font-medium capitalize">{selectedModel.provider}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Streaming:</span>
                <div className="font-medium">
                  {selectedModel.supports_streaming ? 'Supported' : 'Not supported'}
                </div>
              </div>
            </div>

            {/* Model-specific configuration */}
            {selectedModel.config_options && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm">Model Configuration</h4>

                {Object.entries(selectedModel.config_options).map(([key, option]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`config-${key}`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>

                    {option.type === 'select' && (
                      <Select
                        value={modelConfig[key] || selectedModel.default_config?.[key] || ''}
                        onValueChange={(value) => handleConfigChange(key, value)}
                      >
                        <SelectTrigger id={`config-${key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                ))}

                {/* GPT-5/o1 specific notice */}
                {selectedModel.id.startsWith('o1') && (
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-purple-900 mb-1">
                          Reasoning Model
                        </div>
                        <div className="text-purple-700">
                          This model uses extended thinking time for complex reasoning tasks.
                          Response latency will be higher but quality may improve for analytical
                          queries.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Default config info */}
            {selectedModel.default_config &&
              Object.keys(selectedModel.default_config).length > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm font-medium mb-2">Default Configuration:</div>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(selectedModel.default_config, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
