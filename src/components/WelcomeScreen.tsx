'use client';

import React, { useState } from 'react';

interface WelcomeScreenProps {
  onEmailSubmit: (email: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function WelcomeScreen({ onEmailSubmit, isLoading = false, error }: WelcomeScreenProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('School email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      onEmailSubmit(email.trim().toLowerCase());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fadeIn">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Logo */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 mb-8 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white overflow-hidden">
          <img
            src="/logo.png"
            alt="ISP Wellness Assistant Logo"
            className="w-full h-full object-contain p-2"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">
          ISP Wellness Assistant
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-center">
          Your friendly wellness companion.
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
          <div>
            <label htmlFor="schoolEmail" className="block text-sm font-medium text-foreground mb-2">
              School Email *
            </label>
            <input
              id="schoolEmail"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="yourname@school.edu"
            />
            {(emailError || error) && (
              <p className="mt-1 text-sm text-destructive">
                {emailError || error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-8 bg-primary text-primary-foreground text-lg sm:text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Loading...' : 'Start'}
          </button>
        </form>
      </div>
    </div>
  );
}
