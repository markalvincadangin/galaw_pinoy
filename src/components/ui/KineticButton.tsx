'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface KineticButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue hover:bg-blue-700 text-white shadow-lg hover:shadow-xl shadow-brand-blue/30',
  danger: 'bg-brand-red hover:bg-red-700 text-white shadow-lg hover:shadow-xl shadow-brand-red/30',
  ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20 hover:border-white/30',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function KineticButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  onClick,
  type = 'button',
}: KineticButtonProps) {
  const [shinePosition, setShinePosition] = useState(-100);

  const handleMouseEnter = () => {
    // Trigger shine animation
    setShinePosition(100);
    setTimeout(() => {
      setShinePosition(-100);
    }, 600);
  };

  return (
    <motion.button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-display uppercase tracking-wide transition-all duration-200 relative overflow-hidden',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onMouseEnter={handleMouseEnter}
    >
      {/* Shine effect overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: shinePosition === 100 ? '100%' : '-100%' }}
        transition={{
          duration: 0.6,
          ease: 'easeInOut',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          transform: 'skewX(-20deg)',
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
