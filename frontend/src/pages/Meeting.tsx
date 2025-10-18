import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Mic, MicOff, Play, Square, Volume2, WifiOff, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TranscriptionPanel } from "@/components/meeting/TranscriptionPanel";
import { SummaryPanel } from "@/components/meeting/SummaryPanel";
import { AIAgentControls } from "@/components/meeting/AIAgentControls";
import { useTranscription } from "@/hooks/useTranscription";
import { useToast } from "@/hooks/use-toast";
import { UserButton } from "@clerk/clerk-react";

const Meeting = () => {
  const [isAgentActive, setIsAgentActive] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    transcriptions,
    isConnected,
    isTranscribing,
    isCapturing,
    hasPermission,
    error,
    startTranscription,
    stopTranscription,
    requestPermission
  } = useTranscription();

  // Show errors as toasts
  if (error) {
    toast({
      title: "Transcription Error",
      description: error,
      variant: "destructive"
    });
  }

  // Handle start/stop listening
  const handleToggleListening = async () => {
    if (isTranscribing) {
      stopTranscription();
    } else {
      // Request permission first if needed
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use transcription",
            variant: "destructive"
          });
          return;
        }
      }

      const started = await startTranscription();
      if (started) {
        toast({
          title: "Transcription Started",
          description: "Your voice is being transcribed in real-time"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-aurora opacity-20 animate-pulse-glow pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-glass bg-card/30">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <MessageSquareText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SayLess</h1>
                <p className="text-xs text-muted-foreground">Meeting Session</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={isConnected ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}
              >
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-2" />
                    Disconnected
                  </>
                )}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isTranscribing) stopTranscription();
                }}
              >
                End Session
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Transcription */}
            <div className="lg:col-span-2 space-y-6">
              <TranscriptionPanel
                isListening={isTranscribing}
                transcriptions={transcriptions}
              />
              
              {/* Control Bar */}
              <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      variant={isTranscribing ? "destructive" : "default"}
                      onClick={handleToggleListening}
                      disabled={!isConnected}
                      className={!isTranscribing ? "bg-gradient-primary hover:shadow-glow-strong" : ""}
                    >
                      {isTranscribing ? (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Start Listening
                        </>
                      )}
                    </Button>

                    {isCapturing && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-primary rounded-full animate-pulse-glow"
                              style={{
                                height: `${12 + Math.random() * 12}px`,
                                animationDelay: `${i * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-primary font-medium">Listening...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      {isCapturing ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - AI Agent & Summary */}
            <div className="space-y-6">
              <Card className="p-0.5 overflow-hidden border-2 border-card-border rounded-lg shadow-lg">
                <div className={`relative p-6 rounded-[5.5px] h-full ${isAgentActive ? "bg-gradient-primary" : "bg-gradient-muted"}`}>
                  <AIAgentControls
                    isActive={isAgentActive}
                    onToggle={() => setIsAgentActive(!isAgentActive)}
                  />
                </div>
              </Card>
              <SummaryPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Meeting;
