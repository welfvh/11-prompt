/**
 * Prompt editor - vertical layout, all sections visible
 * Auto-assembles system prompt from components
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ApiService } from '@/services/api';
import type { PromptConfig } from '@/types';
import { Save, Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react';

interface PromptEditorProps {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
  onPromptUpdated: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  selectedPromptId,
  onPromptChange,
  onPromptUpdated,
}) => {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<PromptConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAssembledPrompt, setShowAssembledPrompt] = useState(false);

  // Auto-assemble system prompt from components
  const assembledPrompt = useMemo(() => {
    if (!currentPrompt) return '';

    let prompt = '';

    // Name/Title
    if (currentPrompt.name) {
      prompt += `# ${currentPrompt.name}\n\n`;
    }

    // Identity & Role
    if (currentPrompt.use_case) {
      prompt += `# Identität & Rolle\n${currentPrompt.use_case}\n\n`;
    }

    // Tone & Communication Style
    if (currentPrompt.tone) {
      prompt += `# Ton & Kommunikationsstil\n${currentPrompt.tone}\n\n`;
    }

    // Behavior & Guidelines
    if (currentPrompt.behavior) {
      prompt += `# Verhalten & Richtlinien\n${currentPrompt.behavior}\n\n`;
    }

    // Formatting guidelines
    prompt += `# Formatierung & Struktur\n`;
    prompt += `- Nutze Bulletpoints (•) wenn sinnvoll, um Antworten übersichtlicher und lesbarer zu machen\n`;
    prompt += `- Strukturiere längere Antworten in logische Abschnitte\n`;
    prompt += `- Hebe wichtige Informationen hervor\n\n`;

    // Additional Instructions
    if (currentPrompt.additional_instructions) {
      prompt += `# Zusätzliche Anweisungen\n${currentPrompt.additional_instructions}\n\n`;
    }

    return prompt.trim();
  }, [currentPrompt]);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (selectedPromptId) {
      loadPrompt(selectedPromptId);
    }
  }, [selectedPromptId]);

  const loadPrompts = async () => {
    try {
      const data = await ApiService.listPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const loadPrompt = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await ApiService.getPrompt(id);
      setCurrentPrompt(data);
    } catch (error) {
      console.error('Error loading prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPrompt) return;

    setIsSaving(true);
    try {
      // Use the assembled prompt as the system_prompt
      const promptToSave = {
        ...currentPrompt,
        system_prompt: assembledPrompt,
      };

      if (prompts.find((p) => p.id === currentPrompt.id)) {
        await ApiService.updatePrompt(currentPrompt.id, promptToSave);
      } else {
        await ApiService.createPrompt(promptToSave);
      }
      await loadPrompts();
      onPromptUpdated();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Fehler beim Speichern: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!currentPrompt) return;

    const markdown = `# ${currentPrompt.name}\n\n${assembledPrompt}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPrompt.name.replace(/\s+/g, '-').toLowerCase()}-prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reserved for future "Create New" button functionality
  // const handleCreateNew = () => {
  //   const newPrompt: PromptConfig = {
  //     id: `prompt_${Date.now()}`,
  //     name: 'Neuer Prompt',
  //     tone: '',
  //     behavior: '',
  //     use_case: '',
  //     system_prompt: '',
  //     additional_instructions: '',
  //     metadata: { author: 'user', tags: [] },
  //   };
  //   setCurrentPrompt(newPrompt);
  //   onPromptChange(newPrompt.id);
  // };

  const handleDelete = async () => {
    if (!currentPrompt || !confirm('Möchten Sie diesen Prompt wirklich löschen?')) return;

    try {
      await ApiService.deletePrompt(currentPrompt.id);
      await loadPrompts();
      if (prompts.length > 0) {
        onPromptChange(prompts[0].id);
      }
      onPromptUpdated();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const updatePrompt = (updates: Partial<PromptConfig>) => {
    if (!currentPrompt) return;
    setCurrentPrompt({ ...currentPrompt, ...updates });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Lädt...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prompt-Konfiguration</CardTitle>
            <CardDescription>
              Alle Prompt-Komponenten auf einen Blick
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {currentPrompt && currentPrompt.id !== 'default' && (
              <Button onClick={handleDelete} size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {!currentPrompt ? (
          <div className="text-center text-muted-foreground py-8">
            Prompt auswählen oder erstellen
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold border-b pb-2">Grundinformationen</h3>

              <div className="space-y-2">
                <Label htmlFor="prompt-name">Name</Label>
                <Input
                  id="prompt-name"
                  value={currentPrompt.name}
                  onChange={(e) => updatePrompt({ name: e.target.value })}
                  placeholder="z.B. Kundenservice - Freundlich"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="use-case">Identität & Rolle</Label>
                <Textarea
                  id="use-case"
                  value={currentPrompt.use_case}
                  onChange={(e) => updatePrompt({ use_case: e.target.value })}
                  placeholder="z.B. Du bist ein KI-Assistent für 1&1 Kundenservice..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Beschreiben Sie die Identität und Rolle des Assistenten
                </p>
              </div>
            </div>

            {/* Tone Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-2">Ton & Kommunikationsstil</h3>
              <div className="space-y-2">
                <Label htmlFor="tone">Wie soll der Assistent kommunizieren?</Label>
                <Textarea
                  id="tone"
                  value={currentPrompt.tone}
                  onChange={(e) => updatePrompt({ tone: e.target.value })}
                  placeholder="z.B. professionell, freundlich, einfühlsam"
                  rows={4}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-1">💡 Beispiele:</p>
                  <ul className="space-y-1 text-blue-700 text-xs">
                    <li>• Professionell und höflich</li>
                    <li>• Warm und gesprächig</li>
                    <li>• Direkt und effizient</li>
                    <li>• Geduldig und verständnisvoll</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Behavior Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-2">Verhalten & Richtlinien</h3>
              <div className="space-y-2">
                <Label htmlFor="behavior">Was soll der Assistent tun (und was nicht)?</Label>
                <Textarea
                  id="behavior"
                  value={currentPrompt.behavior}
                  onChange={(e) => updatePrompt({ behavior: e.target.value })}
                  placeholder="z.B. Immer Kundenidentität prüfen, proaktive Lösungen anbieten"
                  rows={8}
                />
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                  <p className="font-medium text-green-900 mb-1">📋 Berücksichtigen Sie:</p>
                  <ul className="space-y-1 text-green-700 text-xs">
                    <li>• Antwortstruktur (Begrüßung, Problem, Lösung, Abschluss)</li>
                    <li>• Wann an menschliche Agents eskalieren</li>
                    <li>• Umgang mit Unsicherheit</li>
                    <li>• Datenschutz und Sicherheit</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Instructions Section */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold border-b pb-2">Zusätzliche Anweisungen</h3>
              <div className="space-y-2">
                <Label htmlFor="additional">Zusätzliche Anweisungen (Optional)</Label>
                <Textarea
                  id="additional"
                  value={currentPrompt.additional_instructions || ''}
                  onChange={(e) => updatePrompt({ additional_instructions: e.target.value })}
                  placeholder="Zusätzlicher Kontext oder Anweisungen..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Ergänzende Informationen die wichtig sein könnten
                </p>
              </div>
            </div>

            {/* Assembled Prompt Preview */}
            <div className="space-y-3">
              <button
                onClick={() => setShowAssembledPrompt(!showAssembledPrompt)}
                className="flex items-center gap-2 text-base font-semibold border-b pb-2 w-full hover:text-slate-600"
              >
                {showAssembledPrompt ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Vollständiger Prompt (automatisch zusammengesetzt)
              </button>
              {showAssembledPrompt && (
                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-slate-700">
                      {assembledPrompt || '(Kein Inhalt)'}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dieser Prompt wird automatisch aus den obigen Komponenten zusammengesetzt und beim Speichern verwendet.
                  </p>
                </div>
              )}
            </div>

            {/* Save and Export Buttons */}
            <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white">
              <Button onClick={handleExport} variant="outline" size="lg" disabled={!currentPrompt}>
                <Download className="h-4 w-4 mr-2" />
                Als Markdown exportieren
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="lg"
                className="bg-[#003D8F] hover:bg-[#002a63]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Speichert...' : 'Prompt speichern'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
