import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Zap } from "lucide-react";

interface EnhancedTitleProps {
  lines: string[];
  className?: string;
  delay?: number;
}

export function EnhancedTitle({ lines, className, delay = 0 }: EnhancedTitleProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Floating particles around the title */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main title lines */}
      <div className="space-y-2">
        {lines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: delay + (index * 0.2),
              ease: "easeOut"
            }}
            className="relative"
          >
            <motion.span
              className="inline-block relative"
            >
              {index === 0 ? (
                <motion.span
                  className="relative"
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
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {line}
                  {/* Sparkle effect */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </motion.span>
              ) : (
                <span className="text-foreground relative">
                  {line}
                  {index === 1 && (
                    <motion.div
                      className="absolute -top-1 -right-8"
                      animate={{
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </motion.div>
                  )}
                </span>
              )}
            </motion.span>
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl -z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1,
                delay: delay + (index * 0.3) + 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 3,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Animated underline */}
      <motion.div
        className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full mt-4"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{
          duration: 1.5,
          delay: delay + 1,
          ease: "easeOut",
        }}
      />
    </div>
  );
}

interface TypewriterTitleProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function TypewriterTitle({ text, className, delay = 0, speed = 50 }: TypewriterTitleProps) {
  return (
    <motion.h1
      className={cn("text-6xl md:text-7xl font-bold leading-tight", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.span
        className="inline-block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ 
          duration: text.length * speed / 1000, 
          delay: delay + 0.5, 
          ease: "easeInOut" 
        }}
        style={{ 
          overflow: "hidden", 
          whiteSpace: "nowrap",
          borderRight: "3px solid",
          borderColor: "transparent"
        }}
      >
        {text}
      </motion.span>
    </motion.h1>
  );
}
