import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  variant?: "gradient" | "wave" | "typewriter" | "floating";
  delay?: number;
}

export function AnimatedTitle({ 
  text, 
  className, 
  variant = "gradient", 
  delay = 0 
}: AnimatedTitleProps) {

  if (variant === "typewriter") {
    return (
      <motion.h1
        className={cn("text-6xl md:text-7xl font-bold leading-tight", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay }}
      >
        <motion.span
          className="inline-block"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, delay: delay + 0.5, ease: "easeInOut" }}
          style={{ overflow: "hidden", whiteSpace: "nowrap" }}
        >
          {text}
        </motion.span>
      </motion.h1>
    );
  }

  if (variant === "floating") {
    return (
      <motion.h1
        className={cn("text-6xl md:text-7xl font-bold leading-tight", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay }}
      >
        <motion.span
          className="inline-block"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.span>
      </motion.h1>
    );
  }

  if (variant === "wave") {
    return (
      <motion.h1
        className={cn("text-6xl md:text-7xl font-bold leading-tight", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        {text}
      </motion.h1>
    );
  }

  // Default gradient variant
  return (
    <motion.h1
      className={cn("text-6xl md:text-7xl font-bold leading-tight", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.span
        className="inline-block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ backgroundSize: '200% 200%' }}
      >
        {text}
      </motion.span>
    </motion.h1>
  );
}

interface MultiLineAnimatedTitleProps {
  lines: string[];
  className?: string;
  delay?: number;
}

export function MultiLineAnimatedTitle({ 
  lines, 
  className, 
  delay = 0 
}: MultiLineAnimatedTitleProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {lines.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: delay + (index * 0.2),
            ease: "easeOut"
          }}
          className="overflow-hidden"
        >
          <motion.span
            className="inline-block"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: delay + (index * 0.2) + 0.1,
              ease: "easeOut"
            }}
          >
            {index === 0 ? (
              <motion.span
                animate={{
                  color: [
                    '#ef4444', // red
                    '#f97316', // orange
                    '#eab308', // yellow
                    '#22c55e', // green
                    '#06b6d4', // cyan
                    '#3b82f6', // blue
                    '#8b5cf6', // violet
                    '#ec4899', // pink
                    '#ef4444'  // back to red
                  ],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {line}
              </motion.span>
            ) : (
              <span className="text-foreground">{line}</span>
            )}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}
