import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnotationProps {
  key?: React.Key;
  delay: number;
  label: string;
  x: string;
  y: string;
  width: string;
  height: string;
  color: string;
}

const Annotation = ({ delay, label, x, y, width, height, color }: AnnotationProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0, 1, 0.5, 1, 0],
      scale: [0.98, 1, 1],
    }}
    transition={{ 
      duration: 3, 
      delay, 
      times: [0, 0.1, 0.2, 0.9, 1],
      ease: "easeInOut",
    }}
    className="absolute pointer-events-none"
    style={{ left: x, top: y, width, height }}
  >
    {/* Bounding Box Corners */}
    <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${color}`} />
    <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${color}`} />
    <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${color}`} />
    <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${color}`} />
    
    {/* Label Tag */}
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + 0.2 }}
      className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest ${color.replace('border-', 'bg-')} text-black flex items-center gap-2`}
    >
      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
      {label}
    </motion.div>

    {/* Metadata lines */}
    <motion.div 
      initial={{ height: 0 }}
      animate={{ height: '40px' }}
      transition={{ delay: delay + 0.5 }}
      className={`absolute -bottom-10 left-4 w-px ${color.replace('border-', 'bg-')} opacity-30`}
    />
  </motion.div>
);

const LoadingOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1000); // Wait for exit animation
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        >
          {/* Scanning Line - Constrained to central area */}
          <motion.div 
            animate={{ 
              y: ['20vh', '80vh'] 
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-teal/50 to-transparent opacity-50 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
          />

          {/* Annotations dispersed towards edges */}
          <Annotation label="CORE_TITLE_ANALYSIS" x="15%" y="30%" width="30%" height="40%" color="border-brand-teal" delay={0.2} />
          <Annotation label="ALIGNMENT_V1" x="5%" y="15%" width="180px" height="120px" color="border-brand-purple" delay={0.8} />
          <Annotation label="HEURISTIC_OVERLAY" x="80%" y="60%" width="140px" height="80px" color="border-brand-teal" delay={1.4} />
          <Annotation label="NEURAL_GRID_ACTIVE" x="10%" y="70%" width="100px" height="100px" color="border-brand-purple" delay={2.1} />
          <Annotation label="CREATIVE_LOCK" x="85%" y="20%" width="80px" height="120px" color="border-brand-teal" delay={2.5} />

          {/* Bottom Data Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute bottom-12 left-12 font-mono text-[8px] space-y-1 text-white"
          >
            <div>// LATENCY: 24MS</div>
            <div>// AGENT_COUNT: 1,024</div>
            <div>// BUFFER_STATE: OPTIMAL</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
