'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrustScoreGaugeProps {
  score: number;
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let current = 0;

    const interval = setInterval(() => {
      current += Math.ceil(score / 40);
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setDisplayScore(current);
    }, 30);

    return () => clearInterval(interval);
  }, [score]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (score: number) => {
    if (score >= 75) return 'SAFE';
    if (score >= 50) return 'CAUTION';
    return 'HIGH RISK';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-32 h-32">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />

          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getColor(score)}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-foreground">
              {displayScore}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              SCORE
            </div>
          </motion.div>
        </div>
      </div>

      {/* Verdict label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`mt-4 px-4 py-2 rounded-full text-sm font-bold text-center ${
          score >= 75
            ? 'verdict-safe'
            : score >= 50
              ? 'verdict-caution'
              : 'verdict-risk'
        }`}
      >
        {getLabel(score)}
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-muted-foreground text-center mt-3"
      >
        {score >= 75
          ? 'This property appears legitimate'
          : score >= 50
            ? 'Some concerns require verification'
            : 'Multiple fraud indicators detected'}
      </motion.p>
    </motion.div>
  );
}
