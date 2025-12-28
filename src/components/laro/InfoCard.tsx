'use client';

import { ReactNode, ComponentType } from 'react';
import { motion } from 'framer-motion';

type InfoCardProps = {
  icon: ComponentType<{ className?: string }>; // React component that accepts className
  title: string;
  color: string;
  children: ReactNode;
};

function InfoCard({ icon: Icon, title, color, children }: InfoCardProps) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-modern rounded-3xl p-6 md:p-8 cultural-texture"
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3">{title}</h3>
        <div className="text-base md:text-lg text-white/90 leading-relaxed font-body">{children}</div>
      </motion.div>
    );
  }
  
  export default InfoCard;
  