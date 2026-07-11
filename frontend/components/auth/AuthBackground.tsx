'use client';

import { motion } from 'framer-motion';

export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
          <radialGradient id="grad1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="grad2">
            <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#5b8cff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background gradient */}
        <rect width="1200" height="800" fill="#0b0d17" />

        {/* Animated gradient circles */}
        <motion.circle
          cx="200"
          cy="150"
          r="300"
          fill="url(#grad1)"
          filter="url(#blur)"
          animate={{
            cx: [200, 250, 200],
            cy: [150, 200, 150],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.circle
          cx="1000"
          cy="650"
          r="350"
          fill="url(#grad2)"
          filter="url(#blur)"
          animate={{
            cx: [1000, 950, 1000],
            cy: [650, 600, 650],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  );
}
