import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot } from "lucide-react";
import { useEffect, useRef } from "react";

interface Transcription {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
  confidence?: number;
}

interface TranscriptionPanelProps {
  isListening: boolean;
  transcriptions: Transcription[];
}

export const TranscriptionPanel = ({ isListening, transcriptions }: TranscriptionPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

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
        <div ref={scrollRef} className="space-y-4 pr-4">
          {transcriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {isListening ? "Listening... Speak to see transcription" : "Start listening to begin transcription"}
              </p>
            </div>
          ) : (
            transcriptions.map((item) => {
              const isAI = item.speaker.toLowerCase().includes('ai') || item.speaker.toLowerCase().includes('twin');
              const timeAgo = getTimeAgo(item.timestamp);

              return (
                <div
                  key={item.id}
                  className={`flex gap-3 ${!item.isFinal ? 'opacity-60' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAI ? 'bg-gradient-primary' : 'bg-muted'
                  }`}>
                    {isAI ? (
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <User className="w-4 h-4 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {item.speaker.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                      {!item.isFinal && (
                        <span className="text-xs text-primary">• transcribing...</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

// Helper function to get time ago
function getTimeAgo(timestamp: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
