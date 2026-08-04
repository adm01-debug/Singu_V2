import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateSection {
  stage: string;
  content: string;
  techniques?: string[];
  emotionalIntensity?: number;
  powerWords?: string[];
}

interface Template {
  id: string;
  name: string;
  channel?: string;
  targetProfile?: { disc?: string };
  estimatedConversion?: number;
  bestFor?: string[];
  sections: TemplateSection[];
}

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  templates: Template[];
  stageConfig: Record<string, { label: string; colorClass: string }>;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  showConversion?: boolean;
}

export function CopywritingTemplateTab({
  icon,
  title,
  description,
  templates,
  stageConfig,
  copiedId,
  onCopy,
  showConversion = false,
}: Props) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <ScrollArea className="h-[400px]">
        {templates.map((template) => (
          <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">{template.name}</h5>
              <div className="flex gap-2">
                {template.channel && <Badge variant="outline">{template.channel}</Badge>}
                {template.targetProfile?.disc && (
                  <Badge>DISC: {template.targetProfile.disc}</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {template.sections.map((section) => {
                const config = stageConfig[section.stage] || { label: section.stage.toUpperCase(), colorClass: 'bg-muted border-muted-foreground' };
                return (
                  <div key={section.stage} className={cn("rounded p-3 border-l-4", config.colorClass)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium uppercase">{config.label}</span>
                      {section.emotionalIntensity && (
                        <div className="flex gap-1">
                          {Array.from({ length: section.emotionalIntensity }).map((_, i) => (
                            <span key={i} className="text-accent text-xs">●</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm">{section.content}</p>
                    {section.techniques && section.techniques.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {section.techniques.map(tech => (
                          <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    )}
                    {section.powerWords && section.powerWords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {section.powerWords.slice(0, 4).map(word => (
                          <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between">
              {showConversion && template.estimatedConversion && (
                <span className="text-xs text-muted-foreground">
                  Conversão estimada: {template.estimatedConversion}%
                </span>
              )}
              {template.bestFor && template.bestFor.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-2">Ideal para:</span>
                  {template.bestFor.map(use => (
                    <Badge key={use} variant="outline" className="text-xs">{use}</Badge>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopy(
                  template.sections.map(s => s.content).join('\n\n'),
                  template.id
                )}
              >
                {copiedId === template.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
