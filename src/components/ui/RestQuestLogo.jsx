import React from 'react';
import { motion } from 'framer-motion';

export function RestQuestLogo({ className = '', size = 240, animated = true }) {
  const logoVariants = animated ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  } : {};

  // Simple, reliable logo using CSS and HTML - no SVG text issues
  const LogoContent = () => (
    <div 
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      style={{ 
        width: size,
        minWidth: size
      }}
    >
      <div className="relative w-full">
        {/* Main Logo Text */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={animated ? { opacity: 0, y: -10 } : {}}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={animated ? { duration: 0.6, delay: 0.1 } : {}}
            className="text-6xl font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #3BC9DB 18%, #1971C2 42%, #155E75 68%, #0B4F6C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(25, 113, 194, 0.4))',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            rest
          </motion.div>
          
          {/* Heart Icon */}
          <motion.span
            initial={animated ? { opacity: 0, scale: 0 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={animated ? { 
              delay: 0.5, 
              duration: 0.5, 
              type: "spring", 
              stiffness: 300,
              damping: 20
            } : {}}
            className="text-3xl mt-1"
            style={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #1971C2 50%, #0B4F6C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ❤
          </motion.span>
          
          <motion.div
            initial={animated ? { opacity: 0, y: 10 } : {}}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={animated ? { duration: 0.6, delay: 0.2 } : {}}
            className="text-5xl font-black leading-none mt-1"
            style={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #3BC9DB 18%, #1971C2 42%, #155E75 68%, #0B4F6C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(25, 113, 194, 0.4))',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            quest
          </motion.div>
        </div>
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        className="inline-flex items-center justify-center w-full"
      >
        <LogoContent />
      </motion.div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center w-full">
      <LogoContent />
    </div>
  );
}
