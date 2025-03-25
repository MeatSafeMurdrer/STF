/**
 * This file contains functions for handling token metadata and image storage.
 * In a production environment, these would connect to real storage services.
 */

// Mock storage for our demo application
const tokenStorage = new Map<string, any>();

/**
 * Upload a file to storage and return a URL
 * @param file The file to upload
 * @returns A promise that resolves to the URL of the uploaded file
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    // In a real implementation, this would upload to a storage service
    // For our demo, we'll create a data URL from the file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Store the data URL in our mock storage
        const fileId = `file_${Date.now()}`;
        tokenStorage.set(fileId, result);
        // Return a URL that will work in our application
        resolve(`/api/files/${fileId}`);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload metadata to storage and return a URL
 * @param metadata The metadata to upload
 * @returns A promise that resolves to the URL of the uploaded metadata
 */
export const uploadMetadata = async (metadata: any): Promise<string> => {
  try {
    // In a real implementation, this would upload to a storage service
    // For our demo, we'll store it in our mock storage
    const metadataId = `metadata_${Date.now()}`;
    tokenStorage.set(metadataId, metadata);
    return `/api/metadata/${metadataId}`;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
};

/**
 * Get a file or metadata from storage
 * @param url The URL of the file or metadata
 * @returns The file or metadata
 */
export const getFromStorage = (url: string): any => {
  // Extract the ID from the URL
  const id = url.split('/').pop();
  if (!id) {
    throw new Error('Invalid URL');
  }
  
  // Get the item from storage
  const item = tokenStorage.get(id);
  if (!item) {
    throw new Error('Item not found');
  }
  
  return item;
};

/**
 * Register API routes for our mock storage
 * This would be handled by a real API in production
 */
export const registerStorageRoutes = () => {
  // Mock API route for files
  window.fetch = ((originalFetch) => {
    return async (...args) => {
      const url = args[0];
      if (typeof url === 'string' && url.startsWith('/api/files/')) {
        const id = url.split('/').pop();
        if (id && tokenStorage.has(id)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ url: tokenStorage.get(id) }),
            text: async () => tokenStorage.get(id),
            blob: async () => {
              const dataUrl = tokenStorage.get(id);
              const response = await originalFetch(dataUrl);
              return response.blob();
            }
          } as Response;
        }
      }
      
      // Mock API route for metadata
      if (typeof url === 'string' && url.startsWith('/api/metadata/')) {
        const id = url.split('/').pop();
        if (id && tokenStorage.has(id)) {
          return {
            ok: true,
            status: 200,
            json: async () => tokenStorage.get(id),
            text: async () => JSON.stringify(tokenStorage.get(id))
          } as Response;
        }
      }
      
      // Pass through to original fetch for all other requests
      return originalFetch(...args);
    };
  })(window.fetch);
};