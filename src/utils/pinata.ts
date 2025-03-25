import axios from 'axios';

// Pinata API credentials
const PINATA_API_KEY = '6469040755d354c95b7d';
const PINATA_API_SECRET = '6ef49c8e4515618aab03fc8c837fdcb1f8a7dbdf5d7edd24d597e39b27e3e6fa';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5MzViNmE0MC02NjQzLTRlMWYtOTIxYS03NTVmOTEyZjc5MzYiLCJlbWFpbCI6InRoZWNsZW04OUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNjQ2OTA0MDc1NWQzNTRjOTViN2QiLCJzY29wZWRLZXlTZWNyZXQiOiI2ZWY0OWM4ZTQ1MTU2MThhYWIwM2ZjOGM4MzdmZGNiMWY4YTdkYmRmNWQ3ZWRkMjRkNTk3ZTM5YjI3ZTNlNmZhIiwiZXhwIjoxNzcyMzk3NzgyfQ.HhT14PLJ-j9rr0UmcjOLbKCKnXsTwlMouYTyPftjPNU';

// Pinata API endpoints
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';
const PINATA_DEDICATED_GATEWAY_URL = 'https://bronze-imperial-anaconda-751.mypinata.cloud/ipfs/';

/**
 * Upload a file to Pinata IPFS
 * @param file File to upload
 * @param name Optional name for the file
 * @returns Promise with the IPFS hash (CID)
 */
export const uploadFileToPinata = async (file: File, name?: string): Promise<string> => {
  try {
    console.log('Preparing to upload file to Pinata:', file.name);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata if name is provided
    if (name) {
      const metadata = JSON.stringify({
        name: name,
        keyvalues: {
          type: 'token-image',
          timestamp: Date.now().toString()
        }
      });
      formData.append('pinataMetadata', metadata);
    }
    
    // Add pinning options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    });
    formData.append('pinataOptions', pinataOptions);
    
    // Upload to Pinata
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (response.status === 200) {
      const ipfsHash = response.data.IpfsHash;
      console.log('File uploaded to Pinata with hash:', ipfsHash);
      return ipfsHash;
    } else {
      throw new Error(`Failed to upload file to Pinata: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to Pinata IPFS
 * @param metadata Metadata object
 * @param name Optional name for the metadata
 * @returns Promise with the IPFS hash (CID)
 */
export const uploadJsonToPinata = async (metadata: any, name?: string): Promise<string> => {
  try {
    console.log('Preparing to upload metadata to Pinata');
    
    // Prepare metadata for Pinata
    const pinataMetadata = name ? {
      name: name,
      keyvalues: {
        type: 'token-metadata',
        timestamp: Date.now().toString()
      }
    } : undefined;
    
    // Prepare pinning options
    const pinataOptions = {
      cidVersion: 1,
      wrapWithDirectory: false
    };
    
    // Upload to Pinata
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      {
        pinataContent: metadata,
        pinataMetadata,
        pinataOptions
      },
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200) {
      const ipfsHash = response.data.IpfsHash;
      console.log('Metadata uploaded to Pinata with hash:', ipfsHash);
      return ipfsHash;
    } else {
      throw new Error(`Failed to upload metadata to Pinata: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw error;
  }
};

/**
 * Get the IPFS URL for a hash using the default Pinata gateway
 * @param ipfsHash IPFS hash (CID)
 * @returns IPFS URL
 */
export const getIpfsUrl = (ipfsHash: string): string => {
  return `${PINATA_GATEWAY_URL}${ipfsHash}`;
};

/**
 * Get the public gateway URL for a hash using the dedicated Pinata gateway
 * @param ipfsHash IPFS hash (CID)
 * @returns Public gateway URL
 */
export const getPublicGatewayUrl = (ipfsHash: string): string => {
  return `${PINATA_DEDICATED_GATEWAY_URL}${ipfsHash}`;
};

/**
 * Extract IPFS hash from a URL
 * @param url IPFS URL
 * @returns IPFS hash (CID)
 */
export const extractIpfsHashFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Check if it's an IPFS URL
  if (url.includes('/ipfs/')) {
    return url.split('/ipfs/')[1];
  }
  
  return null;
};

/**
 * Create a data URL from a file (fallback method)
 * @param file File to convert
 * @returns Data URL
 */
export const createDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Test Pinata connection
 * @returns Promise with test result
 */
export const testPinataConnection = async (): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${PINATA_API_URL}/data/testAuthentication`,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('Error testing Pinata connection:', error);
    return false;
  }
};