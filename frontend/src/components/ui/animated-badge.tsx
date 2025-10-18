import { motion } from "framer-motion";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnimatedBadgeProps extends BadgeProps {
  children: React.ReactNode;
  pulse?: boolean;
}

export function AnimatedBadge({ children, pulse = false, className, ...props }: AnimatedBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Badge
        className={cn(
          pulse && "animate-pulse-glow",
          className
        )}
        {...props}
      >
        {children}
      </Badge>
    </motion.div>
  );
}

