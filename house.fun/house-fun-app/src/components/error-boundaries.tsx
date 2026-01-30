'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for catching React errors in child components
 * Prevents entire app crash when a component fails
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center border border-red-500/20">
            <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            </div>
            <h2 className="text-xl font-black text-white mb-2">Something Went Wrong</h2>
            <p className="text-white/60 text-sm mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg text-left overflow-auto">
                <p className="text-red-400 text-xs font-mono">{this.state.error.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Game-specific error boundary with casino-themed fallback
 */
export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GameErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center border border-white/10">
            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <span className="material-symbols-outlined text-white/40 text-4xl">casino</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Game Error</h2>
            <p className="text-white/50 text-sm mb-6">
              The house always wins... but not when there's a bug! We're working on it.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors border border-white/10"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-primary hover:bg-primary/80 text-black font-bold rounded-lg transition-colors"
              >
                Back to Lobby
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wallet error boundary for connection issues
 */
export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WalletErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">account_balance_wallet</span>
            <div>
              <p className="text-red-400 font-bold text-sm">Wallet Connection Error</p>
              <p className="text-red-400/60 text-xs">Please refresh and reconnect your wallet</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
