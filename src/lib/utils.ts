import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * Strips all HTML tags and returns plain text.
 * Use this for all user-generated content before saving to database.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags - only allow plain text
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  // Trim whitespace and normalize
  return sanitized.trim();
}

/**
 * Sanitizes user input while preserving some basic formatting.
 * Allows only safe inline elements for display purposes.
 * Use sparingly - prefer sanitizeInput for most cases.
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  }).trim();
}
