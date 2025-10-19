import { motion } from "framer-motion";
import { Mic, MessageSquare, Video, Sparkles, Brain, Headphones } from "lucide-react";

export function FloatingIcons() {
  const icons = [
    { Icon: Video, position: "top-20 left-10", delay: 0, duration: 4 },
    { Icon: Mic, position: "top-40 right-20", delay: 0.5, duration: 3.5 },
    { Icon: MessageSquare, position: "bottom-40 left-20", delay: 1, duration: 4.5 },
    { Icon: Brain, position: "top-1/3 right-10", delay: 1.5, duration: 3.8 },
    { Icon: Sparkles, position: "bottom-32 right-32", delay: 0.8, duration: 4.2 },
    { Icon: Headphones, position: "top-1/2 left-16", delay: 1.2, duration: 3.6 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.position} opacity-10 dark:opacity-20`}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <item.Icon className="w-12 h-12 text-primary" />
        </motion.div>
      ))}
    </div>
  );
}

