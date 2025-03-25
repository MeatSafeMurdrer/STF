import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const TokenCreationInfo: React.FC = () => {
  return (
    <div className="bg-background-dark/50 rounded-lg p-6 border border-primary/20">
      <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
        <AlertTriangle size={20} className="mr-2" />
        Important Information About Token Creation
      </h3>
      
      <div className="space-y-4 text-gray-300">
        <p>
          This application is currently connected to the <span className="text-secondary font-semibold">Solana Devnet</span>. 
          Tokens created here are for testing purposes only and have no real value.
        </p>
        
        <div className="bg-background-dark/70 p-4 rounded-lg">
          <h4 className="font-semibold text-secondary mb-2">To create a token, you'll need:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>A Solana wallet (like Phantom or Solflare) connected to Devnet</li>
            <li>Some Devnet SOL for transaction fees</li>
          </ul>
        </div>
        
        <p>
          If you need Devnet SOL, you can get some from a faucet:
        </p>
        
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://solfaucet.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:text-primary-light"
          >
            <ExternalLink size={14} />
            Solana Faucet
          </a>
          
          <a 
            href="https://faucet.solana.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:text-primary-light"
          >
            <ExternalLink size={14} />
            Official Solana Faucet
          </a>
        </div>
      </div>
    </div>
  );
};

export default TokenCreationInfo;