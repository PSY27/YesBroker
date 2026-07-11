'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <main className="bg-[#0A0E1A]">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthScreen
            key="auth"
            onAuthenticate={() => setIsAuthenticated(true)}
          />
        ) : (
          <Dashboard key="dashboard" onLogout={() => setIsAuthenticated(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
