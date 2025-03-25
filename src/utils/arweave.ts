import Arweave from 'arweave';

// Initialize Arweave
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
});

/**
 * Import a wallet from a JWK file
 * @param file The JWK file
 * @returns The wallet object
 */
export const importWalletFromFile = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jwk = JSON.parse(e.target?.result as string);
        resolve(jwk);
      } catch (error) {
        reject(new Error('Invalid JWK file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

/**
 * Get the address of an Arweave wallet
 * @param wallet The wallet object
 * @returns The wallet address
 */
export const getWalletAddress = async (wallet: any): Promise<string> => {
  try {
    return await arweave.wallets.jwkToAddress(wallet);
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw new Error('Failed to get wallet address');
  }
};

/**
 * Get the balance of an Arweave wallet
 * @param address The wallet address
 * @returns The balance in AR
 */
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const winstonBalance = await arweave.wallets.getBalance(address);
    const arBalance = arweave.ar.winstonToAr(winstonBalance);
    return arBalance;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return '0';
  }
};

/**
 * Upload a file to Arweave using a wallet
 * @param file The file to upload
 * @param wallet The wallet to use for the transaction
 * @returns The transaction ID
 */
export const uploadFileToArweave = async (file: File, wallet: any): Promise<string> => {
  try {
    // Read the file as an array buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Create a transaction
    const transaction = await arweave.createTransaction(
      { data: fileBuffer },
      wallet
    );
    
    // Add tags to the transaction
    transaction.addTag('Content-Type', file.type);
    transaction.addTag('App-Name', 'SolanaTokenCreator');
    
    // Sign the transaction
    await arweave.transactions.sign(transaction, wallet);
    
    // Submit the transaction
    const uploader = await arweave.transactions.getUploader(transaction);
    
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    
    return transaction.id;
  } catch (error) {
    console.error('Error uploading file to Arweave:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to Arweave using a wallet
 * @param metadata The metadata object
 * @param wallet The wallet to use for the transaction
 * @returns The transaction ID
 */
export const uploadMetadataToArweave = async (metadata: any, wallet: any): Promise<string> => {
  try {
    // Convert metadata to JSON string
    const metadataString = JSON.stringify(metadata);
    
    // Create a transaction
    const transaction = await arweave.createTransaction(
      { data: metadataString },
      wallet
    );
    
    // Add tags to the transaction
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'SolanaTokenCreator');
    transaction.addTag('Type', 'Token-Metadata');
    
    // Sign the transaction
    await arweave.transactions.sign(transaction, wallet);
    
    // Submit the transaction
    const uploader = await arweave.transactions.getUploader(transaction);
    
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    
    return transaction.id;
  } catch (error) {
    console.error('Error uploading metadata to Arweave:', error);
    throw error;
  }
};

/**
 * Get the URL for an Arweave transaction
 * @param transactionId The transaction ID
 * @returns The URL
 */
export const getArweaveUrl = (transactionId: string): string => {
  return `https://arweave.net/${transactionId}`;
};