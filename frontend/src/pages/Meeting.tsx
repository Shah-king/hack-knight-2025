import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Mic, MicOff, Play, Square, Volume2 } from "lucide-react";
import { useState } from "react";
import { TranscriptionPanel } from "@/components/meeting/TranscriptionPanel";
import { SummaryPanel } from "@/components/meeting/SummaryPanel";
import { AITwinControls } from "@/components/meeting/AITwinControls";

const Meeting = () => {
  const [isListening, setIsListening] = useState(false);
  const [isTwinActive, setIsTwinActive] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-aurora opacity-20 animate-pulse-glow pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-glass bg-card/30">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EchoTwin</h1>
                <p className="text-xs text-muted-foreground">Meeting Session</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/30 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow mr-2" />
                Live Demo
              </Badge>
              <Button variant="outline" size="sm">
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
              <TranscriptionPanel isListening={isListening} />
              
              {/* Control Bar */}
              <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      variant={isListening ? "destructive" : "default"}
                      onClick={() => setIsListening(!isListening)}
                      className={!isListening ? "bg-gradient-primary hover:shadow-glow-strong" : ""}
                    >
                      {isListening ? (
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

                    {isListening && (
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
                      {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - AI Twin & Summary */}
            <div className="space-y-6">
              <AITwinControls 
                isActive={isTwinActive} 
                onToggle={() => setIsTwinActive(!isTwinActive)} 
              />
              <SummaryPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Meeting;
