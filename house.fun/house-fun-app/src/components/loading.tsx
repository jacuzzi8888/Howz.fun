'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Generic loading spinner with casino theme
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-2 border-white/10 border-t-primary rounded-full animate-spin" />
    </div>
  );
};

/**
 * Full page loading screen
 */
export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="size-24 border-2 border-white/5 rounded-full animate-pulse" />
        
        {/* Middle ring */}
        <div className="absolute inset-4 border-2 border-primary/20 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
        
        {/* Inner spinner */}
        <div className="absolute inset-8 border-t-2 border-primary rounded-full animate-spin" />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">casino</span>
        </div>
      </div>
      
      <p className="mt-6 text-white/40 text-sm font-bold uppercase tracking-[0.2em]">
        Loading...
      </p>
    </div>
  );
};

/**
 * Game loading state with themed animation
 */
export const GameLoader: React.FC<{ gameName: string }> = ({ gameName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative mb-6">
        {/* Animated rings */}
        <div className="size-20 border border-white/5 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 border border-primary/20 rounded-full animate-pulse" />
        <div className="absolute inset-4 border-t-2 border-primary rounded-full animate-spin" />
        
        {/* Game icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/30 text-3xl">sports_esports</span>
        </div>
      </div>
      
      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
        Loading {gameName}
      </h3>
      <p className="text-white/40 text-xs uppercase tracking-widest">
        Preparing the table...
      </p>
    </div>
  );
};

/**
 * Button loading state
 */
export const ButtonLoader: React.FC<{ text?: string }> = ({ text = 'Processing...' }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <LoadingSpinner size="sm" />
      <span className="text-sm font-bold">{text}</span>
    </div>
  );
};

/**
 * Card skeleton loader
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-xl p-4 animate-pulse">
      <div className="h-32 bg-white/5 rounded-lg mb-4" />
      <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
      <div className="h-4 bg-white/5 rounded w-1/2" />
    </div>
  );
};

/**
 * Transaction loading state for blockchain operations
 */
export const TransactionLoader: React.FC<{ 
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  message?: string;
}> = ({ status, message }) => {
  const statusConfig = {
    pending: {
      icon: 'schedule',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20',
      defaultMessage: 'Waiting for wallet approval...',
    },
    confirming: {
      icon: 'sync',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      defaultMessage: 'Confirming transaction...',
    },
    confirmed: {
      icon: 'check_circle',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      defaultMessage: 'Transaction confirmed!',
    },
    failed: {
      icon: 'error',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      defaultMessage: 'Transaction failed',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined ${config.color} ${status === 'confirming' ? 'animate-spin' : ''}`}>
          {config.icon}
        </span>
        <div>
          <p className={`${config.color} font-bold text-sm`}>
            {message || config.defaultMessage}
          </p>
          {status === 'confirming' && (
            <p className="text-white/40 text-xs mt-1">
              This may take a few seconds...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
