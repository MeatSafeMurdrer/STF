import React from 'react';
import { LogOut } from 'lucide-react';

interface ConnectWalletProps {
  connected: boolean;
  publicKey: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ 
  connected, 
  publicKey, 
  onConnect, 
  onDisconnect 
}) => {
  const handleConnect = () => {
    // In a real app, this would connect to a Solana wallet
    // For this demo, we'll just use a dummy address
    onConnect('DummyWalletAddress123456789');
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:block px-3 py-1.5 rounded-lg bg-background-dark/50 border border-white/10">
          <span className="text-sm text-gray-300">
            {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
          </span>
        </div>
        <button 
          onClick={onDisconnect}
          className="btn btn-outline"
          title="Disconnect wallet"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleConnect}
      className="btn btn-primary"
    >
      Connect Wallet
    </button>
  );
};

export default ConnectWallet;