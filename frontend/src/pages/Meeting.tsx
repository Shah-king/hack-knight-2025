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
import { motion } from "framer-motion";

const Meeting = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mic" | "bot">("mic");
  const navigate = useNavigate();

  // Transcription (microphone) hooks
  const {
    transcriptions,
    isConnected,
    isTranscribing,
    isCapturing,
    hasPermission,
    error,
    startTranscription,
    stopTranscription,
    requestPermission,
  } = useTranscription();

  // Bot (Zoom integration) hooks
  const { botData, hasActiveBot, leaveMeeting, muteBot, unmuteBot, speak } =
    useBot();

  // Show errors as toasts
  if (error) {
    toast({
      title: "Transcription Error",
      description: error,
      variant: "destructive",
    });
  }

  // Handle start/stop listening (microphone mode)
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
      title: "AI Assistant Launched",
      description: `Bot "${botData.botName}" is joining meeting ${botData.meetingNumber}`,
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

  // Handle bot mute/unmute
  const handleBotMute = async () => {
    const success = await muteBot();
    if (success) {
      toast({
        title: "Bot Muted",
        description: "AI Assistant is now muted",
      });
    }
  };

  const handleBotUnmute = async () => {
    const success = await unmuteBot();
    if (success) {
      toast({
        title: "Bot Unmuted",
        description: "AI Assistant can now speak",
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isTranscribing) stopTranscription();
                }}
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
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <TranscriptionPanel
                  isListening={isTranscribing}
                  transcriptions={transcriptions}
                />
              </motion.div>

              {/* Control Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10 hover:border-primary/20 transition-all">
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
                          Listening...
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
                </Card>
              </motion.div>
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
                          bot to join Zoom meetings.
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
                      onMute={handleBotMute}
                      onUnmute={handleBotUnmute}
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

              <SummaryPanel />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Meeting;
