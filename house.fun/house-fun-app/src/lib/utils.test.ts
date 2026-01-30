import { describe, it, expect } from 'vitest';
import { cn, formatSol, shortenAddress, formatUsd, formatPercent } from './utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', 'p-6')).toBe('p-6');
      expect(cn('flex', 'items-center')).toBe('flex items-center');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', true && 'block')).toBe('base block');
    });

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null)).toBe('base');
    });
  });

  describe('formatSol', () => {
    it('should format lamports to SOL', () => {
      expect(formatSol(1000000000)).toBe('1.0000');
      expect(formatSol(500000000)).toBe('0.5000');
      expect(formatSol(1234567890)).toBe('1.2346');
    });

    it('should handle zero', () => {
      expect(formatSol(0)).toBe('0.0000');
    });
  });

  describe('shortenAddress', () => {
    it('should shorten Solana addresses', () => {
      const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      expect(shortenAddress(address)).toBe('7xKX...gAsU');
    });

    it('should handle custom char count', () => {
      expect(shortenAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 6)).toBe('7xKXtg...osgAsU');
    });
  });

  describe('formatUsd', () => {
    it('should format USD values', () => {
      expect(formatUsd(1000)).toBe('$1,000.00');
      expect(formatUsd(0.5)).toBe('$0.50');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages with sign', () => {
      expect(formatPercent(0.25)).toBe('+0.25%');
      expect(formatPercent(1)).toBe('+1.00%');
      expect(formatPercent(-0.5)).toBe('-0.50%');
    });
  });
});
