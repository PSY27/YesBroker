'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface AuthFormProps {
  onSubmit: () => void;
  isLoading?: boolean;
}

export function AuthForm({ onSubmit, isLoading = false }: AuthFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Mobile-only Logo */}
      <motion.div
        className="lg:hidden flex items-center justify-center gap-3 mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-10 h-10 relative">
          <Image
            src="/yesbroker-logo.png"
            alt="YesBroker"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-xl font-bold text-gold tracking-tight">YesBroker</span>
      </motion.div>

      <div className="glassmorphic-card shadow-2xl !p-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignup
              ? 'Join thousands of smart renters'
              : 'Sign in to verify your next rental'}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-1 mb-6 p-1 rounded-xl border border-[rgba(212,168,67,0.08)]"
          style={{ background: 'rgba(17, 24, 39, 0.5)' }}
          layout
        >
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              !isSignup
                ? 'btn-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isSignup
                ? 'btn-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignup && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-premium"
              required
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Helper text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground/60 text-center py-1"
          >
            Demo mode — any credentials will work
          </motion.p>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 btn-primary rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Shield className="w-4 h-4" />
                  </motion.div>
                  Authenticating...
                </>
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-[rgba(212,168,67,0.08)]"
        >
          {['End-to-End Encrypted', 'DPDPA Compliant'].map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <Shield className="w-3 h-3 text-[#1A9D8F]/50" />
              {badge}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-muted-foreground/50 mt-6"
      >
        Protected by YesBroker AI verification engine
      </motion.p>
    </motion.div>
  );
}
