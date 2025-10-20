import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, Brain } from "lucide-react";

interface MagneticTitleProps {
  lines: string[];
  className?: string;
  delay?: number;
}

export function MagneticTitle({ lines, className, delay = 0 }: MagneticTitleProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main title lines */}
      <div className="space-y-1 relative z-10">
        {lines.map((line, index) => (
          <MagneticLine key={index} line={line} index={index} delay={delay} />
        ))}
      </div>

      {/* Decorative icons */}
      <motion.div
        className="absolute -top-8 -right-8 opacity-60"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Brain className="w-12 h-12 text-primary" />
      </motion.div>
    </div>
  );
}

interface MagneticLineProps {
  line: string;
  index: number;
  delay: number;
}

function MagneticLine({ line, index, delay }: MagneticLineProps) {
  return (
    <motion.div
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
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
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
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {line}
            {/* Animated sparkles */}
            <motion.div
              className="absolute -top-3 -right-6"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </motion.div>
          </motion.span>
        ) : (
          <span className="text-foreground relative">
            {line}
            {index === 1 && (
              <motion.div
                className="absolute -top-2 -right-10"
                animate={{
                  rotate: [0, 20, -20, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Zap className="w-6 h-6 text-cyan-400" />
              </motion.div>
            )}
          </span>
        )}
      </motion.span>
    </motion.div>
  );
}
