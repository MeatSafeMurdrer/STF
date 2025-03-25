import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { createToken } from '../utils/token';
import { initializeMetaplex, uploadFileToMetaplex, uploadMetadataToMetaplex, createTokenMetadata } from '../utils/metaplex';

const MemeCoinForm = () => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [image, setImage] = useState(null);
  const [decimals, setDecimals] = useState(9); // Default decimals
  const [initialSupply, setInitialSupply] = useState(1000000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mintAddress, setMintAddress] = useState(null);

  const wallet = useWallet();
  const connection = new Connection('https://api.devnet.solana.com'); // Use devnet for testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!wallet.publicKey) {
        throw new Error('Please connect your wallet.');
      }

      const metaplex = initializeMetaplex(connection, wallet);

      // 1. Upload the image
      const imageUri = await uploadFileToMetaplex(metaplex, image);

      // 2. Create metadata
      const metadata = {
        name,
        symbol,
        image: imageUri,
        properties: {
          files: [{ uri: imageUri, type: image.type }],
        },
      };

      // 3. Upload metadata
      const metadataUri = await uploadMetadataToMetaplex(metaplex, metadata);

      // 4. Create the token
      const { mintAddress: mint, signature } = await createToken(
        connection,
        wallet.publicKey,
        wallet.signTransaction,
        decimals,
        initialSupply
      );
      setMintAddress(mint.toString());

      // 5. Create token metadata (Metaplex)
      const metadataTx = await createTokenMetadata(
        metaplex,
        mint.toString(),
        name,
        symbol,
        metadataUri
      );

      console.log('Token created successfully!', {
        mintAddress: mint.toString(),
        signature,
        metadataTx,
      });

      // Display success message to the user
    } catch (err) {
      console.error('Error creating token:', err);
      setError(err.message || 'Failed to create token.');
      // Display error message to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs for name, symbol, image, etc. */}
      {/* ... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Token...' : 'Create Token'}
      </button>
      {error && <p className="error">{error}</p>}
      {mintAddress && <p>Token Mint Address: {mintAddress}</p>}
    </form>
  );
};

export default MemeCoinForm;