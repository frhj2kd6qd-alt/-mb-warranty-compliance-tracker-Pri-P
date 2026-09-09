import { useState, useEffect, useCallback, useRef } from "react";

/**
 * A custom hook that manages state in React and keeps it in sync with localStorage.
 * It provides the same functional update interface as useState.
 * 
 * @param key The localStorage key to persist the state under.
 * @param initialValue The fallback value if no value exists in localStorage yet.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep a ref to the latest storedValue to avoid stale closures in setValue
  const valueRef = useRef<T>(storedValue);
  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  // Memoize setValue to ensure it doesn't change on every render
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const currentValue = valueRef.current;
      const valueToStore = value instanceof Function ? value(currentValue) : value;
      
      // Update the React state
      setStoredValue(valueToStore);
      
      // Persist to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
