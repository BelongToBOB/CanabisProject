import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Property 1: Theme Persistence', () => {
    /**
     * **Validates: Requirements 2.3**
     * 
     * Property: For any theme selection (light or dark), when the user toggles 
     * the theme, the preference should be saved to localStorage and persist 
     * across page reloads.
     */
    it('should save theme preference to localStorage when toggling to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Initial state should be light
      expect(result.current.theme).toBe('light');

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });

      // Verify theme changed to dark
      expect(result.current.theme).toBe('dark');
      
      // Verify localStorage was updated
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('dark');
      
      // Verify dark class was added to document
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should save theme preference to localStorage when toggling to light', () => {
      // Set initial theme to dark
      localStorage.setItem('cannabis-shop-theme', 'dark');
      
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Initial state should be dark (from localStorage)
      expect(result.current.theme).toBe('dark');

      // Toggle to light
      act(() => {
        result.current.toggleTheme();
      });

      // Verify theme changed to light
      expect(result.current.theme).toBe('light');
      
      // Verify localStorage was updated
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('light');
      
      // Verify dark class was removed from document
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should persist theme across component remounts', () => {
      // First render - toggle to dark
      const { result: result1, unmount } = renderHook(() => useTheme(), { wrapper });
      
      act(() => {
        result1.current.setTheme('dark');
      });

      expect(localStorage.getItem('cannabis-shop-theme')).toBe('dark');
      
      // Unmount
      unmount();

      // Second render - should load dark theme from localStorage
      const { result: result2 } = renderHook(() => useTheme(), { wrapper });
      
      expect(result2.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should use setTheme to directly set theme and persist it', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Set theme to dark directly
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Set theme to light directly
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Property 2: Theme Default Behavior', () => {
    /**
     * **Validates: Requirements 2.2**
     * 
     * Property: For any application initialization where no theme preference 
     * exists in localStorage, the system should default to light theme.
     */
    it('should default to light theme when localStorage is empty', () => {
      // Ensure localStorage is empty (already cleared in beforeEach)
      expect(localStorage.getItem('cannabis-shop-theme')).toBeNull();

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Verify theme defaults to light
      expect(result.current.theme).toBe('light');
      
      // Verify dark class is not present
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Verify localStorage is set to light after initialization
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('light');
    });

    it('should default to light theme when localStorage contains invalid value', () => {
      // Set an invalid theme value
      localStorage.setItem('cannabis-shop-theme', 'invalid-theme');

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Verify theme defaults to light
      expect(result.current.theme).toBe('light');
      
      // Verify dark class is not present
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Verify localStorage is corrected to light
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('light');
    });

    it('should default to light theme when localStorage contains null', () => {
      // Explicitly set to null
      localStorage.removeItem('cannabis-shop-theme');

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Verify theme defaults to light
      expect(result.current.theme).toBe('light');
      
      // Verify dark class is not present
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should default to light theme when localStorage contains empty string', () => {
      // Set empty string
      localStorage.setItem('cannabis-shop-theme', '');

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Verify theme defaults to light
      expect(result.current.theme).toBe('light');
      
      // Verify dark class is not present
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Verify localStorage is corrected to light
      expect(localStorage.getItem('cannabis-shop-theme')).toBe('light');
    });
  });
});
