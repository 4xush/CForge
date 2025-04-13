import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names or conditionally applies classes
 * and merges them with Tailwind CSS specific logic.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 