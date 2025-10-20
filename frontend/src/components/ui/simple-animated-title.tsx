import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Zap } from "lucide-react";

interface SimpleAnimatedTitleProps {
  lines: string[];
  className?: string;
  delay?: number;
}

export function SimpleAnimatedTitle({ lines, className, delay = 0 }: SimpleAnimatedTitleProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-60"
            style={{
              left: `${30 + i * 20}%`,
              top: `${40 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main title lines */}
      <div className="space-y-1 relative z-10">
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
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {line}
                {/* Subtle sparkle */}
                <motion.div
                  className="absolute -top-2 -right-4"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.span>
            ) : (
              <span className="text-foreground relative">
                {line}
                {index === 1 && (
                  <motion.div
                    className="absolute -top-1 -right-6"
                    animate={{
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </motion.div>
                )}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Subtle glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-xl -z-10"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
