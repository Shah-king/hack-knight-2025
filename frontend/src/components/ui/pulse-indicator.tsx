import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PulseIndicatorProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function PulseIndicator({ size = "md", color = "primary", className }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "absolute rounded-full",
          sizeClasses[size],
          `bg-${color}`
        )}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className={cn("rounded-full", sizeClasses[size], `bg-${color}`)} />
    </div>
  );
}

