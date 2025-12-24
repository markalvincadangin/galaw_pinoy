'use client';

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tilt?: boolean; // Enable 3D tilt effect
}

export default function GlassCard({
  children,
  className,
  onClick,
  tilt = false,
}: GlassCardProps) {
  // Motion values for tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animation for tilt
  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Normalize to -0.5 to 0.5
    x.set(mouseX / (rect.width / 2) * 0.5);
    y.set(mouseY / (rect.height / 2) * 0.5);
  };

  const handleMouseLeave = () => {
    if (tilt) {
      x.set(0);
      y.set(0);
    }
  };

  return (
            <motion.div
              className={clsx(
                'backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl',
                'transition-all duration-300',
                onClick && 'cursor-pointer',
                className
              )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        filter: 'brightness(1.1)',
      }}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
    >
      <div className={tilt ? 'transform-gpu' : ''}>{children}</div>
    </motion.div>
  );
}

