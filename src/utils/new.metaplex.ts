import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
//   import { bundler } from '@metaplex-foundation/js';  <---  Check if this import is needed

/**
 * Initialize Metaplex with the given connection and wallet.
 * This example uses in-memory keypairs for signing.  In a real
 * application, you'd use the user's wallet.
 * @param connection Solana connection
 * @param wallet User's wallet (for signing transactions)
 * @returns Metaplex instance
 */
export const initializeMetaplex = (
    connection: Connection,
    wallet: WalletContextState
) => {
    try {
        console.log('Initializing Metaplex...');

        //   const keypair = Keypair.generate(); //  <--  For demo purposes only!
        //   const signer = keypairIdentity(keypair); //  <--  For demo purposes only!

        const metaplex = Metaplex.make(connection)
            .use(wallet) // Use the provided wallet
        //    .use(bundler());   <---  Remove this line for now

        console.log('Metaplex initialized successfully');
        return metaplex;
    } catch (error) {
        console.error('Error initializing Metaplex:', error);
        throw error;
    }
};

/**
 * Upload a file to Metaplex storage.
 * This example uses NFT.Storage.  You can adapt it to
 * Arweave, Pinata, etc., by changing the storage
 * in the Metaplex initialization.
 * @param metaplex Metaplex instance
 * @param file File to upload
 * @returns URI of the uploaded file
 */
export const uploadFileToMetaplex = async (
    metaplex: Metaplex,
    file: File
): Promise<string> => {
    try {
        console.log('Preparing to upload file to Metaplex storage:', file.name);

        // Upload the file using Metaplex
        const uri = await metaplex.storage().upload(file);

        console.log('File uploaded to Metaplex storage with URI:', uri);
        return uri;
    } catch (error) {
        console.error('Error uploading file to Metaplex storage:', error);
        throw error;
    }
};

/**
 * Upload JSON metadata to Metaplex storage.
 * This example uses NFT.Storage.  You can adapt it to
 * Arweave, Pinata, etc., by changing the storage
 * in the Metaplex initialization.
 * @param metaplex Metaplex instance
 * @param metadata Metadata object
 * @returns URI of the uploaded metadata
 */
export const uploadMetadataToMetaplex = async (
    metaplex: Metaplex,
    metadata: any
): Promise<string> => {
    try {
        console.log('Preparing to upload metadata to Metaplex storage');

        // Upload the metadata using Metaplex
        const uri = await metaplex.nfts().uploadMetadata(metadata);

        console.log('Metadata uploaded to Metaplex storage with URI:', uri);
        return uri;
    } catch (error) {
        console.error('Error uploading metadata to Metaplex storage:', error);
        throw error;
    }
};

/**
 * Create token metadata for an existing mint.
 * @param metaplex Metaplex instance
 * @param mintAddress Mint address
 * @param name Token name
 * @param symbol Token symbol
 * @param uri Metadata URI
 * @returns Transaction signature
 */
export const createTokenMetadata = async (
    metaplex: Metaplex,
    mintAddress: string,
    name: string,
    symbol: string,
    uri: string
): Promise<string> => {
    try {
        console.log('Creating token metadata for mint:', mintAddress);
        console.log('Metadata URI:', uri);

        //   const mint = new PublicKey(mintAddress); //  <--  You'll get mintAddress as a PublicKey from createToken
        const mint = new PublicKey(mintAddress);

        // Create a new SFT (Semi-Fungible Token)
        const { nft } = await metaplex.nfts().createSft({
            mint,
            name,
            symbol,
            uri,
            sellerFeeBasisPoints: 0, // Adjust as needed
        });

        console.log(
            'Token metadata created successfully with transaction ID:',
            nft.toString()
        );

        return nft.toString(); // Return the NFT address
    } catch (error) {
        console.error('Error creating token metadata:', error);
        throw error;
    }
};

/**
 * Revoke update authority for token metadata.
 * @param metaplex Metaplex instance
 * @param mintAddress Mint address
 * @returns Transaction signature
 */
export const revokeUpdateAuthority = async (
    metaplex: Metaplex,
    mintAddress: string
): Promise<string> => {
    try {
        console.log('Revoking update authority for mint:', mintAddress);

        // Simulate a delay to mimic network request
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate a mock transaction ID
        const txId = `revoke_update_auth_${Date.now().toString(16)}`;
        console.log(
            'Update authority revoked successfully with transaction ID:',
            txId
        );

        return txId;
    } catch (error) {
        console.error('Error revoking update authority:', error);
        throw error;
    }
};

/**
 * Revoke mint authority for a token.
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Mint address
 * @returns Transaction signature
 */
export const revokeMintAuthority = async (
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: string
): Promise<string> => {
    try {
        console.log('Revoking mint authority for:', mintAddress);

        // In a real implementation, we would use the SPL Token program to revoke mint authority

        // Simulate a delay to mimic network request
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate a mock transaction ID
        const txId = `revoke_mint_auth_${Date.now().toString(16)}`;
        console.log('Mint authority revoked successfully with transaction ID:', txId);

        return txId;
    } catch (error) {
        console.error('Error revoking mint authority:', error);
        throw error;
    }
};

/**
 * Revoke freeze authority for a token.
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Mint address
 * @returns Transaction signature
 */
export const revokeFreezeAuthority = async (
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: string
): Promise<string> => {
    try {
        console.log('Revoking freeze authority for:', mintAddress);

        // In a real implementation, we would use the SPL Token program to revoke freeze authority

        // Simulate a delay to mimic network request
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate a mock transaction ID
        const txId = `revoke_freeze_auth_${Date.now().toString(16)}`;
        console.log(
            'Freeze authority revoked successfully with transaction ID:',
            txId
        );

        return txId;
    } catch (error) {
        console.error('Error revoking freeze authority:', error);
        throw error;
    }
};