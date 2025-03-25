import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletButtonProps {
  large?: boolean;
}

const WalletButton: React.FC<WalletButtonProps> = ({ large = false }) => {
  const { connected, publicKey, disconnect } = useWallet();

  // Force disconnect and reconnect if needed
  const handleClick = () => {
    if (connected) {
      // Disconnect first to force a fresh wallet selection
      disconnect();
    }
  };

  return (
    <div>
      <WalletMultiButton 
        className={large ? "wallet-button-large" : "wallet-button"} 
      />
      {connected && publicKey && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </div>
      )}
    </div>
  );
};

export default WalletButton;