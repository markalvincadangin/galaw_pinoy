import React from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

type Difficulty = 'easy' | 'medium' | 'hard';

interface GameCardProps {
  image: string;
  imageAlt: string;
  title: string;
  difficulty: Difficulty;
  duration: string;
  onClick?: () => void;
  className?: string;
}

const difficultyConfig = {
  easy: {
    label: 'Easy',
    color: 'bg-green-500 text-white',
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-500 text-white',
  },
  hard: {
    label: 'Hard',
    color: 'bg-red-500 text-white',
  },
};

export default function GameCard({
  image,
  imageAlt,
  title,
  difficulty,
  duration,
  onClick,
  className,
}: GameCardProps): React.ReactElement {
  const difficultyInfo = difficultyConfig[difficulty];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-panel rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl',
        className
      )}
    >
      {/* Image with diagonal slash clip-path */}
      <div
        className="relative w-full h-48 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
        }}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-brand-blue font-display text-xl font-bold mb-4">
          {title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {/* Difficulty Badge */}
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide',
              difficultyInfo.color
            )}
          >
            {difficultyInfo.label}
          </span>

          {/* Duration Badge */}
          <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-slate-200 text-slate-700">
            {duration}
          </span>
        </div>
      </div>
    </div>
  );
}

