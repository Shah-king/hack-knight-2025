import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  WifiOff,
  Rocket,
  MessageSquareText,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TranscriptionPanel } from "@/components/meeting/TranscriptionPanel";
import { SummaryPanel } from "@/components/meeting/SummaryPanel";
import { LaunchBot } from "@/components/meeting/LaunchBot";
import { BotControls } from "@/components/meeting/BotControls";
import { useTranscription } from "@/hooks/useTranscription";
import { useBot } from "@/hooks/useBot";
import { useToast } from "@/hooks/use-toast";
import { UserButton } from "@clerk/clerk-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FloatingIcons } from "@/components/ui/floating-icons";
import { motion } from "framer-motion";

const Meeting = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mic" | "bot">("bot"); // Changed default to "bot"
  const navigate = useNavigate();

  // Transcription (microphone) hooks
  const {
    transcriptions: micTranscriptions,
    isConnected,
    isTranscribing,
    isCapturing,
    hasPermission,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    requestPermission,
  } = useTranscription();

  // Bot (Recall.ai integration) hooks
  const {
    botData,
    hasActiveBot,
    leaveMeeting,
    generateResponse,
    speak,
    error: botError,
  } = useBot();

  // ✅ FIX: Use different transcription sources based on active tab
  const transcriptions =
    activeTab === "mic" ? micTranscriptions : micTranscriptions;

  // ✅ FIX: Determine if currently listening based on mode
  const isListening = activeTab === "mic" ? isTranscribing : hasActiveBot;

  // ✅ FIX: Determine if bot is actively in call and recording
  const isBotRecording =
    botData?.status === "in_call_recording" ||
    botData?.status === "in_call" ||
    botData?.status === "in_call_not_recording";

  // Show errors as toasts
  if (transcriptionError) {
    toast({
      title: "Transcription Error",
      description: transcriptionError,
      variant: "destructive",
    });
  }

  if (botError) {
    toast({
      title: "Bot Error",
      description: botError,
      variant: "destructive",
    });
  }

  // Handle start/stop listening (microphone mode)
  const handleToggleListening = async () => {
    if (isTranscribing) {
      stopTranscription();
      toast({
        title: "Transcription Stopped",
        description: "Microphone transcription has been stopped",
      });
    } else {
      // Request permission first if needed
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use transcription",
            variant: "destructive",
          });
          return;
        }
      }

      const started = await startTranscription();
      if (started) {
        toast({
          title: "Transcription Started",
          description: "Your voice is being transcribed in real-time",
        });
      }
    }
  };

  // Handle bot launched
  const handleBotLaunched = (botData: any) => {
    toast({
      title: "🤖 AI Assistant Launched",
      description: `Bot is joining the meeting. Transcripts will appear shortly.`,
    });
    setActiveTab("bot"); // Switch to bot tab
  };

  // Handle bot leave
  const handleBotLeave = async () => {
    const success = await leaveMeeting();
    if (success) {
      toast({
        title: "AI Assistant Left",
        description: "Bot has left the meeting",
      });
      setActiveTab("mic");
    }
  };

  // Handle AI response generation
  const handleGenerateResponse = async () => {
    const success = await generateResponse();
    if (success) {
      toast({
        title: "AI Response Generated",
        description: "Bot has generated a response based on the conversation",
      });
    }
  };

  // Handle bot speak
  const handleBotSpeak = async (text: string) => {
    const success = await speak(text);
    if (success) {
      toast({
        title: "Bot Speaking",
        description: text,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated AI Energy Flow Background */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-15 blur-3xl pointer-events-none"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ backgroundSize: '200% 200%' }}
      />
      
      {/* Floating decorative icons */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingIcons />
      </div>
      
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-aurora opacity-20 animate-pulse-glow pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-glass bg-card/30">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <MessageSquareText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SayLess</h1>
                <p className="text-xs text-muted-foreground">Meeting Session</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge
                variant="outline"
                className={
                  isConnected
                    ? "border-primary/30 text-primary"
                    : "border-destructive/30 text-destructive"
                }
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

              {/* ✅ ADDED: Show bot status in header */}
              {hasActiveBot && (
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  {isBotRecording
                    ? "Bot Recording"
                    : `Bot ${botData?.status || "Active"}`}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "mic" && isTranscribing) {
                    stopTranscription();
                  } else if (activeTab === "bot" && hasActiveBot) {
                    handleBotLeave();
                  }
                }}
                disabled={!isTranscribing && !hasActiveBot}
              >
                End Session
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Transcription */}
            <div className="lg:col-span-2 space-y-6">
              {/* ✅ FIX: Pass correct isListening state */}
              <TranscriptionPanel
                isListening={isListening}
                transcriptions={transcriptions}
              />

              {/* Control Bar */}
              <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
                {activeTab === "mic" ? (
                  // Microphone Mode Controls
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        size="lg"
                        variant={isTranscribing ? "destructive" : "default"}
                        onClick={handleToggleListening}
                        disabled={!isConnected}
                        className={
                          !isTranscribing
                            ? "bg-gradient-primary hover:shadow-glow-strong"
                            : ""
                        }
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
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-primary font-medium">
                            Listening to your microphone...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon">
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        {isCapturing ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Bot Mode Controls
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {hasActiveBot ? (
                        <>
                          {/* ✅ FIX: Show different messages based on bot status */}
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                            {isBotRecording ? (
                              <>
                                <div className="flex gap-1">
                                  {[...Array(4)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-primary rounded-full animate-pulse-glow"
                                      style={{
                                        height: `${12 + Math.random() * 12}px`,
                                        animationDelay: `${i * 0.1}s`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-primary font-medium">
                                  Bot listening to meeting...
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                  Bot {botData?.status || "connecting"}...
                                </span>
                              </>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary"
                          >
                            <Rocket className="w-3 h-3 mr-1" />
                            Bot Active
                          </Badge>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Launch a bot to start capturing meeting transcripts
                        </div>
                      )}
                    </div>

                    {hasActiveBot && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBotLeave}
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop Bot
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* ✅ ADDED: Debug panel (only in development) */}
              {import.meta.env.DEV && (
                <Card className="p-4 bg-muted/50 border border-border/50">
                  <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                    🔧 Debug Info
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>WebSocket: {isConnected ? "✅" : "❌"}</div>
                    <div>Bot Active: {hasActiveBot ? "✅" : "❌"}</div>
                    <div>Bot Status: {botData?.status || "N/A"}</div>
                    <div>Is Recording: {isBotRecording ? "✅" : "❌"}</div>
                    <div>Transcripts: {transcriptions.length}</div>
                    <div>Active Tab: {activeTab}</div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - AI Bot & Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "mic" | "bot")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mic" className="gap-2">
                    <Mic className="w-4 h-4" />
                    Microphone
                  </TabsTrigger>
                  <TabsTrigger value="bot" className="gap-2">
                    <Rocket className="w-4 h-4" />
                    Bot Mode
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mic" className="mt-4">
                  <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <Mic className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Microphone Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          Currently transcribing from your microphone. Launch a
                          bot to join Zoom, Meet, or Teams meetings.
                        </p>
                      </div>
                      <Button
                        onClick={() => setActiveTab("bot")}
                        variant="outline"
                        className="border-primary/30 hover:border-primary"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Launch Bot Instead
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="bot" className="mt-4">
                  {hasActiveBot && botData ? (
                    <BotControls
                      botId={botData.botId}
                      botStatus={botData}
                      onLeave={handleBotLeave}
                      onGenerateResponse={handleGenerateResponse}
                      onSpeak={handleBotSpeak}
                    />
                  ) : (
                    <LaunchBot
                      onBotLaunched={handleBotLaunched}
                      onError={(error) => {
                        toast({
                          title: "Launch Failed",
                          description: error,
                          variant: "destructive",
                        });
                      }}
                    />
                  )}
                </TabsContent>
              </Tabs>

              {/* ✅ FIX: Only show summary if we have transcripts */}
              {transcriptions.length > 0 && <SummaryPanel />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Meeting;
