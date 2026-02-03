import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-12345',
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock TextEncoder
Object.defineProperty(global, 'TextEncoder', {
  value: class TextEncoder {
    encode(text: string): Uint8Array {
      return new Uint8Array(Buffer.from(text));
    }
  },
});

// Mock matchMedia
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
