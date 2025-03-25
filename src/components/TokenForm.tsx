import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Rocket, Info, Upload, Globe, Twitter, MessageCircle, Users, User, Shield } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction, 
  getMinimumBalanceForRentExemptMint, 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import TokenPreview from "./TokenPreview";
import ConfirmationModal from "./ConfirmationModal";

// Fee in SOL
const TOKEN_CREATION_FEE = 0.2;

const TokenForm = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    logo: null as File | null,
    decimals: 9,
    tokenSupply: 1000000000,
    description: "",
    creator: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    revokeFreeze: true,
    revokeMint: true,
    revokeUpdate: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [transactionUrl, setTransactionUrl] = useState("");

  const handleNextStep = () => {
    if (validateForm()) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setModalMessage("Please connect your wallet first.");
      setShowModal(true);
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user has enough SOL for the fee
      const balance = await connection.getBalance(publicKey);
      if (balance < TOKEN_CREATION_FEE * LAMPORTS_PER_SOL) {
        setModalMessage(`Insufficient balance. You need at least ${TOKEN_CREATION_FEE} SOL to create a token.`);
        setShowModal(true);
        setLoading(false);
        return;
      }
      
      // Create a new mint account
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;
      
      // Calculate rent for the mint
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      
      // Create transaction for token creation
      const transaction = new Transaction();
      
      // Add instruction to create account for the mint
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintAddress,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      
      // Add instruction to initialize the mint
      transaction.add(
        createInitializeMintInstruction(
          mintAddress,
          formData.decimals,
          publicKey,
          formData.revokeFreeze ? null : publicKey,
          TOKEN_PROGRAM_ID
        )
      );
      
      // Create associated token account for the user
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintAddress,
        publicKey
      );
      
      // Add instruction to create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAddress,
          publicKey,
          mintAddress
        )
      );
      
      // Add instruction to mint tokens to the user
      transaction.add(
        createMintToInstruction(
          mintAddress,
          associatedTokenAddress,
          publicKey,
          BigInt(formData.tokenSupply) * BigInt(10 ** formData.decimals)
        )
      );
      
      // Add fee payment instruction
      const feeRecipient = new PublicKey("11111111111111111111111111111111");
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: feeRecipient,
          lamports: TOKEN_CREATION_FEE * LAMPORTS_PER_SOL,
        })
      );
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair],
      });
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      // Set token address and transaction URL for the modal
      setTokenAddress(mintAddress.toString());
      setTransactionUrl(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      
      // Show success modal
      setModalMessage(
        `Your token ${formData.tokenName} (${formData.tokenSymbol}) has been successfully created! Token Address: ${mintAddress.toString()} View transaction on Solscan: ${`https://explorer.solana.com/tx/${signature}?cluster=devnet`}`
      );
      setShowModal(true);
      
    } catch (error) {
      console.error("Error creating token:", error);
      setModalMessage(`Error creating token: ${error instanceof Error ? error.message : String(error)}`);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        logo: e.target.files[0],
      });
    }
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.tokenName) {
        newErrors.tokenName = "Token name is required";
      }
      
      if (!formData.tokenSymbol) {
        newErrors.tokenSymbol = "Token symbol is required";
      } else if (formData.tokenSymbol.length > 8) {
        newErrors.tokenSymbol = "Token symbol cannot exceed 8 characters";
      }
    }
    
    if (step === 2) {
      if (!formData.description) {
        newErrors.description = "Description is required";
      }
      
      if (formData.tokenSupply <= 0) {
        newErrors.tokenSupply = "Token supply must be greater than 0";
      }
    }
    
    if (step === 3) {
      if (!formData.creator) {
        newErrors.creator = "Creator name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderProgressIndicator = () => (
    <div className="progress-indicator">
      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
        <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
        <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>
    </div>
  );

  const renderStepOne = () => (
    <div className="form-step">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">Token Details</h2>
      <div className="form-group">
        <label htmlFor="tokenName">Token Name:</label>
        <input
          type="text"
          id="tokenName"
          name="tokenName"
          value={formData.tokenName}
          onChange={handleChange}
          placeholder="e.g., Solana Doge"
        />
        {errors.tokenName && <span className="error">{errors.tokenName}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="tokenSymbol">Token Symbol:</label>
        <input
          type="text"
          id="tokenSymbol"
          name="tokenSymbol"
          value={formData.tokenSymbol.toUpperCase()}
          onChange={handleChange}
          placeholder="e.g., SOLDOGE"
          maxLength={8}
        />
        {errors.tokenSymbol && <span className="error">{errors.tokenSymbol}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="logo" className="flex items-center">
          <Upload size={16} className="mr-2" />
          Upload Logo (500x500 PNG recommended):
        </label>
        <input 
          type="file" 
          id="logo" 
          name="logo" 
          onChange={handleLogoChange}
          accept="image/*"
        />
      </div>
      <div className="token-preview">
        <h3>Token Preview</h3>
        <TokenPreview
          name={formData.tokenName || "Your Token"}
          symbol={formData.tokenSymbol || "TOKEN"}
          logo={formData.logo ? URL.createObjectURL(formData.logo) : undefined}
        />
      </div>
      <div className="form-buttons">
        <button className="back-button" disabled={true} style={{ visibility: 'hidden' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="next-button" onClick={handleNextStep}>
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="form-step">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">Token Configuration</h2>
      <div className="form-group">
        <label htmlFor="decimals" className="flex items-center">
          Decimals:
          <Info 
            size={16} 
            className="tooltip-icon" 
            title="Number of decimal places for your token. 9 is standard for most tokens."
          />
        </label>
        <input
          type="number"
          id="decimals"
          name="decimals"
          min="0"
          max="18"
          value={formData.decimals}
          onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="tokenSupply" className="flex items-center">
          Token Supply:
          <Info 
            size={16} 
            className="tooltip-icon" 
            title="Total number of tokens to create. This cannot be changed later if you revoke mint authority."
          />
        </label>
        <input
          type="number"
          id="tokenSupply"
          name="tokenSupply"
          value={formData.tokenSupply}
          onChange={handleChange}
          min="1"
        />
        {errors.tokenSupply && <span className="error">{errors.tokenSupply}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your token and its purpose..."
        />
        {errors.description && <span className="error">{errors.description}</span>}
      </div>
      <div className="form-buttons">
        <button className="back-button" onClick={handlePrevStep}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="next-button" onClick={handleNextStep}>
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="form-step">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">Creator and Socials</h2>
      
      <div className="social-form-container">
        <div className="form-group">
          <label htmlFor="creator" className="social-label">
            <User size={18} className="social-icon creator-icon" />
            Creator Name:
          </label>
          <input
            type="text"
            id="creator"
            name="creator"
            value={formData.creator}
            onChange={handleChange}
            placeholder="Your name or organization"
            className="social-input"
          />
          {errors.creator && <span className="error">{errors.creator}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="website" className="social-label">
            <Globe size={18} className="social-icon website-icon" />
            Website:
          </label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            className="social-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="twitter" className="social-label">
            <Twitter size={18} className="social-icon twitter-icon" />
            Twitter:
          </label>
          <input
            type="text"
            id="twitter"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            placeholder="https://twitter.com/yourusername"
            className="social-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telegram" className="social-label">
            <MessageCircle size={18} className="social-icon telegram-icon" />
            Telegram:
          </label>
          <input
            type="text"
            id="telegram"
            name="telegram"
            value={formData.telegram}
            onChange={handleChange}
            placeholder="https://t.me/yourcommunity"
            className="social-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="discord" className="social-label">
            <Users size={18} className="social-icon discord-icon" />
            Discord:
          </label>
          <input
            type="text"
            id="discord"
            name="discord"
            value={formData.discord}
            onChange={handleChange}
            placeholder="https://discord.gg/yourinvite"
            className="social-input"
          />
        </div>
      </div>
      
      <div className="security-options">
        <h3 className="flex items-center">
          <Shield size={18} className="mr-2 text-emerald-400" />
          Security Options
        </h3>
        <div className="form-group checkbox-group">
          <label htmlFor="revokeFreeze" className="flex items-start">
            <input
              type="checkbox"
              id="revokeFreeze"
              name="revokeFreeze"
              checked={formData.revokeFreeze}
              onChange={handleChange}
            />
            <div>
              <span>Revoke Freeze Authority</span>
              <p className="text-xs text-gray-400 mt-1">
                Permanently removes the ability to freeze token accounts. Recommended for decentralization.
              </p>
            </div>
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label htmlFor="revokeMint" className="flex items-start">
            <input
              type="checkbox"
              id="revokeMint"
              name="revokeMint"
              checked={formData.revokeMint}
              onChange={handleChange}
            />
            <div>
              <span>Revoke Mint Authority</span>
              <p className="text-xs text-gray-400 mt-1">
                Permanently removes the ability to mint more tokens. Recommended for fixed supply tokens.
              </p>
            </div>
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label htmlFor="revokeUpdate" className="flex items-start">
            <input
              type="checkbox"
              id="revokeUpdate"
              name="revokeUpdate"
              checked={formData.revokeUpdate}
              onChange={handleChange}
            />
            <div>
              <span>Revoke Update Authority</span>
              <p className="text-xs text-gray-400 mt-1">
                Permanently removes the ability to update token metadata. Recommended for decentralization.
              </p>
            </div>
          </label>
        </div>
      </div>
      
      <div className="fee-notice mt-6 p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-orange-500 border-opacity-30">
        <h3 className="text-orange-400 font-semibold mb-2 flex items-center">
          <Info size={18} className="mr-2" />
          Fee Information
        </h3>
        <p className="text-gray-300 text-sm">
          Creating a token requires a one-time fee of <span className="text-orange-400 font-semibold">{TOKEN_CREATION_FEE} SOL</span> to cover network costs and service fees.
        </p>
      </div>
      
      <div className="form-buttons">
        <button className="back-button" onClick={handlePrevStep}>
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          className="generate-button" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? 'Creating...' : (
            <>
              <Rocket size={16} />
              Generate Token
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderFormSteps = () => {
    switch (step) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      default:
        return null;
    }
  };

  return (
    <div>
      {renderProgressIndicator()}
      <form onSubmit={(e) => e.preventDefault()}>
        {renderFormSteps()}
      </form>
      
      {showModal && (
        <ConfirmationModal 
          message={modalMessage}
          onConfirm={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TokenForm;