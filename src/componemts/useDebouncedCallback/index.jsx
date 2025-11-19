// src/hooks/useDebouncedCallback.js
import React from 'react';

/**
 * Custom hook: returns a debounced version of a callback.
 * The function will only run after it has stopped being called
 * for the given delay.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=800] - Delay in milliseconds
 * @returns {Function & { flush: Function, cancel: Function }}
 *   debounced(...args) - schedule call
 *   debounced.flush()  - run immediately if there is a pending call
 *   debounced.cancel() - cancel any pending call
 */
export default function useDebouncedCallback(fn, delay = 800) {
  // Holds the timeout ID between renders
  const timer = React.useRef(null);

  // Always keep a ref to the latest version of fn
  const savedFn = React.useRef(fn);

  // Store the latest arguments passed into the debounced function
  const lastArgs = React.useRef([]);

  // Update savedFn when fn changes so we always call the newest callback
  React.useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  // The debounced wrapper function
  const debounced = React.useCallback(
    (...args) => {
      // Save the latest arguments
      lastArgs.current = args;

      // Clear any existing timer
      clearTimeout(timer.current);

      // Start a new timer
      timer.current = setTimeout(() => {
        timer.current = null;
        // Call the latest version of fn with the latest arguments
        savedFn.current(...lastArgs.current);
      }, delay);
    },
    [delay]
  );

  /**
   * Run the pending call immediately (if any) and clear the timer.
   * Useful when you want to force the debounced function to run,
   * e.g. on unmount or on submit.
   */
  debounced.flush = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      const args = lastArgs.current;
      timer.current = null;
      savedFn.current(...args);
    }
  }, []);

  /**
   * Cancel any pending call without executing it.
   */
  debounced.cancel = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return debounced;
}
