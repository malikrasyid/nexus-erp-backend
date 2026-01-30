/**
 * Merges new metadata into existing JSONB attributes
 * Useful for updating a "Hospital" record without losing "Factory" fields
 */
export const mergeMetadata = (current: Record<string, any>, updates: Record<string, any>) => {
    return {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
  };