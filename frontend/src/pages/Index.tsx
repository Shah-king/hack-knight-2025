import { Button } from "@/components/ui/button";
import { Brain, Mic, Sparkles, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { motion } from "framer-motion";
import heroBg from "@/assets/bg1.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating orbs background */}
      <FloatingOrbs />
      
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
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
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-glass border border-primary/20 shadow-glow hover:shadow-glow-strong transition-all cursor-default"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">
                Your AI-powered meeting assistant
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-7xl font-bold leading-tight"
            >
              <AnimatedGradientText>
                Never Miss
              </AnimatedGradientText>
              {" "}a Meeting
              <br />
              <span className="text-foreground">Again</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Your personalized AI assistant joins meetings, listens, summarizes key points,
              responds in any voice, and creates audio lessons.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              {isSignedIn ? (
                <Button
                  size="lg"
                  onClick={() => navigate('/meeting')}
                  className="bg-gradient-primary hover:shadow-glow-strong transition-all group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Try Live Demo
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow-strong transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </SignUpButton>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all group"
              >
                <Mic className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Clone Your Voice
              </Button>
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 pt-16">
              {[
                {
                  icon: Brain,
                  title: "Real-time AI",
                  description: "Listens and understands meetings as they happen",
                  gradient: "from-cyan-500 to-blue-500"
                },
                {
                  icon: Mic,
                  title: "Voice Cloning",
                  description: "Speaks in your own voice using ElevenLabs",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: Sparkles,
                  title: "Smart Summaries",
                  description: "Auto-generates key points and action items",
                  gradient: "from-amber-500 to-orange-500"
                }
              ].map((feature, i) => (
                <SpotlightCard key={i} className="group hover:shadow-glow">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                </SpotlightCard>
              ))}
            </div>

            {/* Additional Features List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-16 grid md:grid-cols-2 gap-4 max-w-2xl mx-auto"
            >
              {[
                "Real-time transcription",
                "Multi-language support",
                "Automatic meeting notes",
                "Voice response capabilities"
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
