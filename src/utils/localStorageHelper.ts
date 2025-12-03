/**
 * Helper functions for safely working with localStorage
 */

/**
 * Safely get and parse JSON from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    return parsed || defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set JSON to localStorage
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Clear all Baseul-related data from localStorage
 */
export function clearBaseulData(): void {
  const keys = [
    'baseul_current_user',
    'baseul_users',
    'baseul_community_posts',
    'baseul_community_replies',
    'baseul_admin_blogs',
  ];
  
  keys.forEach(key => {
    removeStorageItem(key);
  });
  
  // Clear welcome_shown flags
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('welcome_shown_')) {
      removeStorageItem(key);
    }
  });
  
  console.log('Baseul data cleared from localStorage');
}

/**
 * Validate and clean array data
 */
export function validateArray<T>(
  data: any,
  validator: (item: any) => boolean
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.filter(validator);
}
