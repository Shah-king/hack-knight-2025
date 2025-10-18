import { Button } from "@/components/ui/button";
import { Brain, Mic, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-aurora opacity-30 animate-pulse-glow" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15
      }} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SayLess
            </span>
          </div>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="border-primary/30 hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all"
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-glass border border-primary/20 shadow-glow">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">
                Your AI-powered meeting assistant
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Never Miss
              </span>
              {" "}a Meeting
              <br />
              <span className="text-foreground">Again</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your AI clone joins meetings, listens in real-time, summarizes key points, 
              and responds in your own cloned voice when needed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {isSignedIn ? (
                <Button
                  size="lg"
                  onClick={() => navigate('/meeting')}
                  className="bg-gradient-primary hover:shadow-glow-strong transition-all animate-float group"
                >
                  <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Try Live Demo
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow-strong transition-all animate-float group"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Get Started
                  </Button>
                </SignUpButton>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all"
              >
                <Mic className="w-5 h-5 mr-2" />
                Clone Your Voice
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 pt-16">
              {[
                {
                  icon: Brain,
                  title: "Real-time AI",
                  description: "Listens and understands meetings as they happen"
                },
                {
                  icon: Mic,
                  title: "Voice Cloning",
                  description: "Speaks in your own voice using ElevenLabs"
                },
                {
                  icon: Sparkles,
                  title: "Smart Summaries",
                  description: "Auto-generates key points and action items"
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="group p-6 rounded-xl bg-card/50 backdrop-blur-glass border border-primary/10 hover:border-primary/30 transition-all hover:shadow-glow"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
