import React from 'react';
import { Coins } from 'lucide-react';

interface TokenPreviewProps {
  name: string;
  symbol: string;
  logo?: string | null;
}

const TokenPreview: React.FC<TokenPreviewProps> = ({ name, symbol, logo }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-background-dark/70 border-2 border-primary/30 flex items-center justify-center overflow-hidden mb-3">
        {logo ? (
          <img src={logo} alt={`${name} logo`} className="w-full h-full object-cover" />
        ) : (
          <Coins size={40} className="text-primary" />
        )}
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-white">{name}</div>
        <div className="text-sm text-gray-400">{symbol.toUpperCase()}</div>
      </div>
    </div>
  );
};

export default TokenPreview;