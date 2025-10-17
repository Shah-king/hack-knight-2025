import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

export const SummaryPanel = () => {
  const summaryItems = [
    { text: "Q4 product roadmap discussion", completed: true },
    { text: "Marketing timeline finalized", completed: true },
    { text: "Budget approval pending", completed: false },
    { text: "Team assignments needed", completed: false },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-primary/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Meeting Summary</h2>
        <Badge variant="outline" className="border-primary/30 text-primary">
          Live
        </Badge>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Key Points</h3>
            <ul className="space-y-2">
              {summaryItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Action Items</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">Send Q4 timeline to stakeholders</p>
                <p className="text-xs text-muted-foreground mt-1">Due: This week</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">Schedule follow-up meeting</p>
                <p className="text-xs text-muted-foreground mt-1">Due: Next Monday</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
