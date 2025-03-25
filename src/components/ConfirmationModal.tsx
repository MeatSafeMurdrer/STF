import React from 'react';
import { CheckCircle, ExternalLink, Copy } from 'lucide-react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm }) => {
  // Extract token address and explorer link from message if they exist
  const tokenAddressMatch = message.match(/Token Address: ([a-zA-Z0-9]+)/);
  const tokenAddress = tokenAddressMatch ? tokenAddressMatch[1] : null;
  
  const explorerLinkMatch = message.match(/View transaction on Solscan: (https:\/\/[^\s]+)/);
  const explorerLink = explorerLinkMatch ? explorerLinkMatch[1] : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-400" />
            Token Created Successfully
          </h3>
        </div>
        <div className="modal-body">
          <p className="mb-4">{message.split('Token Address:')[0]}</p>
          
          {tokenAddress && (
            <div className="bg-gray-800 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Token Address</span>
                <button 
                  onClick={() => copyToClipboard(tokenAddress)}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Copy size={14} />
                  <span className="text-xs">Copy</span>
                </button>
              </div>
              <p className="text-sm font-mono break-all">{tokenAddress}</p>
            </div>
          )}
          
          {explorerLink && (
            <a 
              href={explorerLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mt-4"
            >
              <ExternalLink size={16} />
              View on Solana Explorer
            </a>
          )}
        </div>
        <div className="modal-footer">
          <button className="primary" onClick={onConfirm}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;