import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot } from "lucide-react";

interface TranscriptionPanelProps {
  isListening: boolean;
}

export const TranscriptionPanel = ({ isListening }: TranscriptionPanelProps) => {
  // Mock transcription data
  const transcriptions = [
    { speaker: "John", text: "Let's discuss the Q4 roadmap for the product launch.", type: "user" },
    { speaker: "AI Twin", text: "Absolutely, I've been tracking the key milestones.", type: "ai" },
    { speaker: "Sarah", text: "What about the marketing timeline?", type: "user" },
    { speaker: "AI Twin", text: "Marketing launch is scheduled for November 15th.", type: "ai" },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10 h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Live Transcription</h2>
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Recording
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-4 pr-4">
          {transcriptions.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.type === 'ai' ? 'bg-gradient-primary' : 'bg-muted'
              }`}>
                {item.type === 'ai' ? (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <User className="w-4 h-4 text-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.speaker}</span>
                  <span className="text-xs text-muted-foreground">just now</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}

          {!isListening && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Start listening to begin transcription</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
