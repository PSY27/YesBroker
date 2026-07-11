'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { AuthForm } from './AuthForm';
import Image from 'next/image';

interface AuthScreenProps {
  onAuthenticate: () => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await new Promise((resolve) => setTimeout(resolve, 200));
    onAuthenticate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen w-full flex overflow-hidden bg-[#0A0E1A]"
    >
      {/* ── Left: Hero panel with background image ── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center">
        {/* Background Image */}
        <Image
          src="/hero-bg.png"
          alt="Premium cityscape"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A] via-[#0A0E1A]/60 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-transparent to-[#0A0E1A]/40 z-[1]" />

        {/* Hero content */}
        <motion.div
          className="relative z-10 px-16 max-w-xl"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 relative">
              <Image
                src="/yesbroker-logo.png"
                alt="YesBroker"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gold tracking-tight">YesBroker</span>
          </motion.div>

          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
            Rent Smart.{' '}
            <span className="text-gold">Rent Safe.</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Our AI agents analyse every listing across 5 dimensions — price, photos, text, web presence & location — so you never fall for a rental scam.
          </p>

          {/* Stats row */}
          <div className="flex gap-8">
            {[
              { value: '10K+', label: 'Listings Verified' },
              { value: '98%', label: 'Fraud Detection' },
              { value: '5', label: 'AI Agents' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <div className="text-2xl font-bold text-gold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right: Auth form panel ── */}
      <div className="w-full lg:w-[45%] relative flex items-center justify-center px-6">
        {/* Mobile background image (shown only on small screens) */}
        <div className="lg:hidden absolute inset-0">
          <Image
            src="/auth-bg.png"
            alt="Background"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[#0A0E1A]/80" />
        </div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,168,67,0.3) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient glow */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#D4A843]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-[#1A9D8F]/5 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AuthForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </motion.div>
      </div>

      {/* ── Floating accent particles ── */}
      <motion.div
        className="absolute top-[15%] right-[42%] w-1.5 h-1.5 rounded-full bg-[#D4A843] opacity-20 pointer-events-none"
        animate={{
          y: [0, 30, 0],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[30%] w-1 h-1 rounded-full bg-[#1A9D8F] opacity-15 pointer-events-none"
        animate={{
          y: [0, -25, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
