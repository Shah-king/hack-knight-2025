import { motion } from "framer-motion";

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large cyan orb */}
      <motion.div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,217,255,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Medium purple orb */}
      <motion.div
        className="absolute top-1/4 right-10 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(180,100,255,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Small pink orb */}
      <motion.div
        className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,100,200,0.1) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

