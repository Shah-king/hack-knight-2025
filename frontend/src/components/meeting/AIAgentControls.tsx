import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Power, Volume2 } from "lucide-react";

interface AIAgentControlsProps {
  isActive: boolean;
  onToggle: () => void;
}

export const AIAgentControls = ({ isActive, onToggle }: AIAgentControlsProps) => {
  const quickResponses = [
    "I agree with that approach",
    "Could you elaborate on that?",
    "Let me check on that and get back to you",
    "That sounds good to me"
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
      <div className="space-y-6">
        {/* AI Agent Status */}
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
            isActive 
              ? 'bg-gradient-primary shadow-glow-strong animate-pulse-glow' 
              : 'bg-muted'
          }`}>
            <Bot className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="font-semibold mb-1">AI Agent</h3>
          <p className="text-sm text-muted-foreground">
            {isActive ? 'Active & Ready' : 'Standby Mode'}
          </p>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={onToggle}
          className={`w-full ${
            isActive 
              ? 'bg-gradient-primary hover:shadow-glow-strong' 
              : 'bg-muted hover:bg-muted/80'
          }`}
          size="lg"
        >
          <Power className="w-5 h-5 mr-2" />
          {isActive ? 'Deactivate Agent' : 'Activate Agent'}
        </Button>

        {/* Quick Responses */}
        {isActive && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Responses</h4>
            {quickResponses.map((response, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-left border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                size="sm"
              >
                <Volume2 className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm truncate">{response}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
