export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
  normalizedSlug?: string;
}

export function validateSlug(slug: string): SlugValidationResult {
  // Convert to lowercase
  const normalizedSlug = slug.toLowerCase().trim();

  // Check if empty
  if (!normalizedSlug) {
    return {
      isValid: false,
      error: 'Slug cannot be empty',
    };
  }

  // Check minimum length
  if (normalizedSlug.length < 4) {
    return {
      isValid: false,
      error: 'Slug must be at least 4 characters',
    };
  }

  // Check maximum length
  if (normalizedSlug.length > 20) {
    return {
      isValid: false,
      error: 'Slug must be 20 characters or less',
    };
  }

  // Check allowed characters (alphanumeric + hyphens only)
  const allowedPattern = /^[a-z0-9-]+$/;
  if (!allowedPattern.test(normalizedSlug)) {
    return {
      isValid: false,
      error: 'Slug can only contain letters, numbers, and hyphens',
    };
  }

  // Check if starts or ends with hyphen
  if (normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
    return {
      isValid: false,
      error: 'Slug cannot start or end with a hyphen',
    };
  }

  // Check for consecutive hyphens
  if (normalizedSlug.includes('--')) {
    return {
      isValid: false,
      error: 'Slug cannot contain consecutive hyphens',
    };
  }

  return {
    isValid: true,
    normalizedSlug,
  };
}