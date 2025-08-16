// Authentication system test suite
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAuthStore } from '../src/auth';

// Mock Tauri APIs
// SQL plugin no longer used

jest.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: jest.fn(),
  writeTextFile: jest.fn(),
  exists: jest.fn(() => Promise.resolve(false)),
  createDir: jest.fn(),
}));

jest.mock('@tauri-apps/plugin-http', () => ({
  fetch: jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })),
}));

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      deriveBits: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
    },
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('Authentication System', () => {
  beforeEach(() => {
    // Reset auth store state
    useAuthStore.getState()._setUser(null);
    useAuthStore.getState()._setAppKey(null);
    useAuthStore.getState()._setAccessToken(null);
  });

  describe('Auth Store', () => {
    it('should initialize with empty state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.appKey).toBeNull();
      expect(state.accessToken).toBeNull();
    });

    it('should update authentication state', () => {
      const store = useAuthStore.getState();
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'AUTHOR',
      };

      store._setUser(mockUser);
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should clear in-memory data', () => {
      const store = useAuthStore.getState();
      
      // Set some data
      store._setUser({ id: '1', name: 'Test', email: 'test@example.com', role: 'AUTHOR' });
      store._setAccessToken('test-token');
      
      // Clear in-memory data
      store.clearInMemoryData();
      
      // User should remain, but sensitive data should be cleared
      expect(store.user).not.toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.appKey).toBeNull();
    });
  });

  describe('Offline Detection', () => {
    it('should detect online status', () => {
      const store = useAuthStore.getState();
      store.setOnlineStatus(true);
      expect(store.isOnline).toBe(true);
      
      store.setOnlineStatus(false);
      expect(store.isOnline).toBe(false);
    });
  });
});

export {};
