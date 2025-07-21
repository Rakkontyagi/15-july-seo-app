import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callbacks
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(() => callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

/**
 * Custom hook for debounced async operations
 * @param asyncOperation - The async operation to debounce
 * @param delay - The delay in milliseconds
 * @returns Object with debounced function, loading state, and error state
 */
export function useDebouncedAsync<T, Args extends any[]>(
  asyncOperation: (...args: Args) => Promise<T>,
  delay: number = 500
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const debouncedOperation = useDebouncedCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await asyncOperation(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    delay,
    [asyncOperation]
  );

  return {
    execute: debouncedOperation,
    isLoading,
    error,
    data,
    reset: () => {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  };
}
