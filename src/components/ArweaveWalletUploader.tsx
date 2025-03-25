import React, { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { importWalletFromFile, getWalletAddress, getWalletBalance } from '../utils/arweave';

interface ArweaveWalletUploaderProps {
  onWalletLoaded: (wallet: any) => void;
}

const ArweaveWalletUploader: React.FC<ArweaveWalletUploaderProps> = ({ onWalletLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setLoading(true);
    setError(null);

    try {
      // Import the wallet from the file
      const wallet = await importWalletFromFile(file);
      
      // Get the wallet address
      const address = await getWalletAddress(wallet);
      setWalletAddress(address);
      
      // Get the wallet balance
      const balance = await getWalletBalance(address);
      setWalletBalance(balance);
      
      // Pass the wallet to the parent component
      onWalletLoaded(wallet);
    } catch (err) {
      console.error('Error loading Arweave wallet:', err);
      setError('Failed to load Arweave wallet. Please make sure you uploaded a valid JWK file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-dark/50 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-semibold mb-3 text-secondary">Arweave Wallet</h3>
      
      {!walletAddress ? (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            Upload your Arweave wallet JWK file to enable metadata storage.
          </p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-background-dark/30 hover:bg-background-dark/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload size={24} className="text-primary mb-2" />
              <p className="mb-2 text-sm text-gray-300">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">JWK wallet file</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".json,application/json" 
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
          
          {loading && (
            <div className="mt-3 text-center">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
              <span className="ml-2 text-sm text-gray-300">Loading wallet...</span>
            </div>
          )}
          
          {error && (
            <div className="mt-3 flex items-start text-red-400 text-sm">
              <AlertCircle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-2">
            <Check size={16} className="text-green-400 mr-2" />
            <span className="text-sm font-medium text-gray-200">Wallet loaded successfully</span>
          </div>
          
          <div className="bg-background-dark/70 rounded p-3 mb-2">
            <p className="text-xs text-gray-400 mb-1">Wallet Address:</p>
            <p className="text-sm font-mono text-gray-300 break-all">{walletAddress}</p>
          </div>
          
          <div className="bg-background-dark/70 rounded p-3">
            <p className="text-xs text-gray-400 mb-1">Balance:</p>
            <p className="text-sm font-medium text-gray-300">{walletBalance} AR</p>
          </div>
          
          {parseFloat(walletBalance || '0') < 0.01 && (
            <div className="mt-3 flex items-start text-yellow-400 text-sm">
              <AlertCircle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
              <span>Low balance. You may not have enough AR to upload files.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArweaveWalletUploader;