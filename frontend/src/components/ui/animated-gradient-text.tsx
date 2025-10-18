import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <motion.span
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
      className={cn(
        "bg-gradient-primary bg-clip-text text-transparent bg-[length:200%_auto]",
        className
      )}
    >
      {children}
    </motion.span>
  );
}

