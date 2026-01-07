export function generateRandomSlug(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    slug += chars[randomIndex];
  }
  
  return slug;
}


export async function generateUniqueSlug(
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateRandomSlug(6);
    const exists = await checkExists(slug);
    
    if (!exists) {
      return slug;
    }
  }
  
  // If we couldn't generate a unique slug after maxAttempts, return null
  return null;
}