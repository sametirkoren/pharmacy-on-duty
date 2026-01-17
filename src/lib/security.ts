/**
 * Security utility functions
 */

// Sanitize string input to prevent XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize search parameters
export function sanitizeSearchParam(param: string | null, maxLength: number = 100): string | null {
  if (!param) return null;
  
  // Trim and limit length
  const trimmed = param.trim().slice(0, maxLength);
  
  // Remove potentially dangerous characters
  return trimmed.replace(/[<>\"'`;(){}]/g, '');
}

// Validate Turkish city/district names
export function isValidTurkishName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) return false;
  
  // Allow Turkish characters, spaces, and common punctuation
  const turkishPattern = /^[a-zA-ZğüşöçıİĞÜŞÖÇ\s\-\.\/()0-9]+$/;
  return turkishPattern.test(name);
}

// Validate numeric ID
export function isValidId(id: string | number): boolean {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return !isNaN(numId) && numId > 0 && numId < Number.MAX_SAFE_INTEGER;
}

// Validate coordinates
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Validate phone number format (Turkish)
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+90|0)?[0-9]{10}$/.test(cleaned);
}

// Generate safe error message (hide internal details)
export function getSafeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
}
