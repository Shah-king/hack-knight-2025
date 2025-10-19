import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, LogOut, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface BotControlsProps {
  botId: string | null;
  botStatus?: {
    botId: string;
    meetingNumber: string;
    botName: string;
    status: string;
    isMuted: boolean;
    isAudioEnabled: boolean;
    joinedAt: Date;
    uptime: number;
  } | null;
  onLeave?: () => void;
  onGenerateResponse?: () => void;
  onSpeak?: (text: string) => void;
}

export const BotControls = ({
  botId,
  botStatus,
  onLeave,
  onGenerateResponse,
  onSpeak
}: BotControlsProps) => {
  const [uptime, setUptime] = useState(0);

  // Update uptime every second
  useEffect(() => {
    if (!botStatus) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(botStatus.joinedAt).getTime();
      setUptime(Math.floor(elapsed / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [botStatus]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const quickResponses = [
    "I agree with that approach",
    "Could you elaborate on that?",
    "Let me check on that and get back to you",
    "That sounds good to me"
  ];

  if (!botId || !botStatus) {
    return null;
  }

  const isConnected = botStatus.status === 'in_call' || botStatus.status === 'in_waiting_room';
  const isJoining = botStatus.status === 'joining' || botStatus.status === 'created';

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
      <div className="space-y-6">
        {/* Bot Status Header */}
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
            isConnected
              ? 'bg-gradient-primary shadow-glow-strong animate-pulse-glow'
              : isJoining
              ? 'bg-yellow-500/20 border-2 border-yellow-500'
              : 'bg-muted'
          }`}>
            <Bot className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="font-semibold mb-1">{botStatus.botName}</h3>
          <Badge
            variant="outline"
            className={
              isConnected
                ? "border-primary/30 text-primary"
                : isJoining
                ? "border-yellow-500/30 text-yellow-500"
                : "border-muted text-muted-foreground"
            }
          >
            {isConnected && (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow mr-2" />
                In Meeting
              </>
            )}
            {isJoining && (
              <>
                <Activity className="w-3 h-3 mr-2 animate-spin" />
                Joining...
              </>
            )}
            {!isConnected && !isJoining && 'Disconnected'}
          </Badge>

          {isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {formatUptime(uptime)}
            </p>
          )}
        </div>

        {/* Meeting Info */}
        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meeting ID</span>
            <span className="font-mono font-medium">{botStatus.meetingNumber}</span>
          </div>
        </div>

        {/* Control Buttons */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onGenerateResponse}
              variant="outline"
              className="border-primary/20 hover:border-primary/50 bg-gradient-primary/10"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Response
            </Button>

            <Button
              onClick={onLeave}
              variant="destructive"
              className="opacity-80 hover:opacity-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        )}

        {/* Status Info */}
        {isConnected && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              Bot is listening to the meeting and collecting transcripts.
              Click "AI Response" to generate a contextual reply.
            </p>
          </div>
        )}

        {/* Joining Status */}
        {isJoining && (
          <div className="text-center py-4">
            <Activity className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Joining meeting...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
