import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Info, Shield, ExternalLink, Coins } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Connection
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
import TokenPreview from './TokenPreview';
import { uploadFileToPinata, uploadJsonToPinata, getPublicGatewayUrl } from '../utils/pinata';
import { initializeMetaplex, createTokenMetadata, uploadFileToMetaplex, uploadMetadataToMetaplex, revokeMintAuthority, revokeFreezeAuthority, revokeUpdateAuthority } from '../utils/metaplex';

interface FormData {
  tokenName: string;
  tokenSymbol: string;
  logo: File | null;
  decimals: number;
  tokenSupply: number;
  description: string;
  creator: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  revokeFreeze: boolean;
  revokeMint: boolean;
  revokeUpdate: boolean;
}

// Fee in SOL - set to 0.2 for mainnet
const TOKEN_CREATION_FEE = 0.19; // Reduced slightly to account for transaction fees
// Fee recipient address - replace with your actual address
const FEE_RECIPIENT = new PublicKey("GfQnxRzm9zn7dNap27FubGu1oARFiwXpSNkN8mVqxeJA");

const TokenCreator: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    tokenName: "",
    tokenSymbol: "",
    logo: null,
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
    revokeUpdate: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [metadataTxId, setMetadataTxId] = useState<string | null>(null);
  const [logoIpfsHash, setLogoIpfsHash] = useState<string | null>(null);
  const [metadataIpfsHash, setMetadataIpfsHash] = useState<string | null>(null);
  const [revokeTxIds, setRevokeTxIds] = useState<{
    mint?: string;
    freeze?: string;
    update?: string;
  }>({});

  const handleNextStep = () => {
    if (validateForm()) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
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
      const file = e.target.files[0];
      setFormData({
        ...formData,
        logo: file,
      });
      
      // Create a preview URL for the logo
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to create metadata JSON
  const createMetadataJson = (logoUrl: string | null) => {
    return {
      name: formData.tokenName,
      symbol: formData.tokenSymbol,
      description: formData.description,
      image: logoUrl || "",
      external_url: formData.website,
      properties: {
        files: logoUrl ? [
          {
            uri: logoUrl,
            type: "image/png"
          }
        ] : [],
        category: "token",
        creators: [
          {
            address: publicKey?.toString() || "",
            share: 100
          }
        ]
      },
      links: {
        website: formData.website,
        twitter: formData.twitter,
        telegram: formData.telegram,
        discord: formData.discord
      }
    };
  };

  const uploadToStorage = async () => {
    try {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }
      
      setUploadStatus("Preparing to upload files...");
      setUploadProgress(10);
      
      let logoUri = null;
      
      // Initialize Metaplex
      const metaplex = initializeMetaplex(connection, wallet);
      
      // Step 1: Upload logo to Metaplex if provided
      if (formData.logo) {
        setUploadStatus("Uploading logo to Metaplex...");
        setUploadProgress(30);
        
        try {
          // Upload logo to Metaplex
          logoUri = await uploadFileToMetaplex(metaplex, formData.logo);
          setLogoUrl(logoUri);
          
          console.log('Logo uploaded successfully');
          console.log('URI:', logoUri);
          
          setUploadProgress(60);
          setUploadStatus("Logo uploaded successfully. Creating metadata...");
        } catch (error) {
          console.error("Error uploading logo to Metaplex:", error);
          
          // If Metaplex upload fails, try Pinata as fallback
          setUploadStatus("Metaplex upload failed. Trying Pinata IPFS...");
          
          try {
            const logoIpfsHash = await uploadFileToPinata(
              formData.logo, 
              `${formData.tokenSymbol}_logo`
            );
            
            // Get the public gateway URL for the logo
            logoUri = getPublicGatewayUrl(logoIpfsHash);
            
            setLogoIpfsHash(logoIpfsHash);
            setLogoUrl(logoUri);
            
            console.log('Logo uploaded to Pinata successfully');
            console.log('IPFS Hash:', logoIpfsHash);
            console.log('Gateway URL:', logoUri);
            
            setUploadProgress(60);
            setUploadStatus("Logo uploaded to Pinata successfully. Creating metadata...");
          } catch (pinataError) {
            console.error("Error uploading logo to Pinata:", pinataError);
            // If both uploads fail, we'll continue without a logo
            logoUri = null;
          }
        }
      }
      
      // Step 2: Create metadata JSON with the logo URL
      setUploadStatus("Creating metadata JSON...");
      const metadata = createMetadataJson(logoUri);
      console.log('Created metadata JSON:', metadata);
      
      // Step 3: Upload metadata to Metaplex
      setUploadStatus("Uploading metadata to Metaplex...");
      
      try {
        // Upload metadata to Metaplex
        const metadataUri = await uploadMetadataToMetaplex(metaplex, metadata);
        setMetadataUrl(metadataUri);
        
        console.log('Metadata uploaded successfully');
        console.log('URI:', metadataUri);
        
        setUploadProgress(100);
        setUploadStatus("Metadata uploaded successfully!");
        
        return { logoUrl: logoUri, metadataUrl: metadataUri };
      } catch (error) {
        console.error("Error uploading metadata to Metaplex:", error);
        
        // If Metaplex upload fails, try Pinata as fallback
        setUploadStatus("Metaplex metadata upload failed. Trying Pinata IPFS...");
        
        try {
          // Upload metadata to Pinata IPFS
          const metadataIpfsHash = await uploadJsonToPinata(
            metadata, 
            `${formData.tokenSymbol}_metadata`
          );
          
          // Get the public gateway URL for the metadata
          const metadataGatewayUrl = getPublicGatewayUrl(metadataIpfsHash);
          
          setMetadataIpfsHash(metadataIpfsHash);
          setMetadataUrl(metadataGatewayUrl);
          
          console.log('Metadata uploaded to Pinata successfully');
          console.log('IPFS Hash:', metadataIpfsHash);
          console.log('Gateway URL:', metadataGatewayUrl);
          
          setUploadProgress(100);
          setUploadStatus("Metadata uploaded to Pinata successfully!");
          
          return { logoUrl: logoUri, metadataUrl: metadataGatewayUrl };
        } catch (pinataError) {
          console.error("Error uploading metadata to Pinata:", pinataError);
          // If both uploads fail, we'll return what we have
          return { logoUrl: logoUri, metadataUrl: null };
        }
      }
    } catch (error) {
      console.error("Error in storage process:", error);
      setErrors({ 
        submit: `Error processing files: ${error instanceof Error ? error.message : String(error)}` 
      });
      return { logoUrl: null, metadataUrl: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !publicKey || !signTransaction) {
      return;
    }
    
    try {
      setLoading(true);
      setErrors({});
      
      // Check if user has enough SOL for the fee
      const balance = await connection.getBalance(publicKey);
      const minimumRequired = TOKEN_CREATION_FEE * LAMPORTS_PER_SOL + 5000000; // 0.19 SOL + 0.005 SOL for tx fees
      
      if (balance < minimumRequired) {
        setErrors({
          submit: `Insufficient balance. You need at least 0.2 SOL to create a token (including transaction fees).`
        });
        setLoading(false);
        return;
      }
      
      // Upload logo and create metadata
      setUploadStatus("Preparing files for upload...");
      setUploadProgress(0);
      
      const { logoUrl, metadataUrl } = await uploadToStorage();
      
      if (!metadataUrl && step === 3) {
        setErrors({
          submit: "Failed to create metadata. Please try again."
        });
        setLoading(false);
        return;
      }
      
      setUploadStatus("Creating token on Solana...");
      
      // Create a new mint account
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;
      
      // Calculate rent for the mint
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      
      // Create transaction for token creation
      const transaction = new Transaction();
      
      // Get recent blockhash for transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
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
      
      // Add fee payment instruction if fee is greater than 0
      if (TOKEN_CREATION_FEE > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEE_RECIPIENT,
            lamports: TOKEN_CREATION_FEE * LAMPORTS_PER_SOL,
          })
        );
      }
      
      // Sign the transaction with the mint keypair
      transaction.sign(mintKeypair);
      
      // Have the user sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }
      
      // Set token address for the success screen
      setTokenAddress(mintAddress.toString());
      setExplorerUrl(`https://explorer.solana.com/address/${mintAddress.toString()}?cluster=mainnet`);
      
      // Create token metadata using Metaplex
      if (metadataUrl) {
        try {
          setUploadStatus("Creating token metadata with Metaplex...");
          
          // Initialize Metaplex
          const metaplex = initializeMetaplex(connection, wallet);
          
          // Create token metadata
          const metadataSignature = await createTokenMetadata(
            metaplex,
            mintAddress.toString(),
            formData.tokenName,
            formData.tokenSymbol,
            metadataUrl
          );
          
          setMetadataTxId(metadataSignature);
          setUploadStatus("Token metadata created successfully!");
          
          // Handle authority revocations if requested
          const newRevokeTxIds: {
            mint?: string;
            freeze?: string;
            update?: string;
          } = {};
          
          if (formData.revokeMint) {
            setUploadStatus("Revoking mint authority...");
            const mintRevokeTxId = await revokeMintAuthority(
              connection,
              wallet,
              mintAddress.toString()
            );
            newRevokeTxIds.mint = mintRevokeTxId;
          }
          
          if (formData.revokeFreeze && !formData.revokeFreeze) {
            // Only needed if freeze authority was set initially
            setUploadStatus("Revoking freeze authority...");
            const freezeRevokeTxId = await revokeFreezeAuthority(
              connection,
              wallet,
              mintAddress.toString()
            );
            newRevokeTxIds.freeze = freezeRevokeTxId;
          }
          
          if (formData.revokeUpdate) {
            setUploadStatus("Revoking update authority...");
            const updateRevokeTxId = await revokeUpdateAuthority(
              metaplex,
              mintAddress.toString()
            );
            newRevokeTxIds.update = updateRevokeTxId;
          }
          
          setRevokeTxIds(newRevokeTxIds);
          
        } catch (metaplexError) {
          console.error("Error creating token metadata:", metaplexError);
          // We'll still consider the token creation successful even if metadata fails
        }
      }
      
      setSuccess(true);
      
    } catch (error) {
      console.error("Error creating token:", error);
      setErrors({
        submit: `Error creating token: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>1</div>
        <div className={`w-16 h-1 ${step > 1 ? 'bg-primary' : 'bg-gray-700'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>2</div>
        <div className={`w-16 h-1 ${step > 2 ? 'bg-primary' : 'bg-gray-700'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>3</div>
      </div>
    </div>
  );

  const renderStepOne = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4 text-secondary">Token Details</h2>
      <div>
        <label htmlFor="tokenName" className="block text-sm font-medium text-gray-300 mb-1">Token Name:</label>
        <input
          type="text"
          id="tokenName"
          name="tokenName"
          value={formData.tokenName}
          onChange={handleChange}
          placeholder="e.g., Solana Doge"
          className="input-field"
        />
        {errors.tokenName && <p className="mt-1 text-red-400 text-sm">{errors.tokenName}</p>}
      </div>
      <div>
        <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-300 mb-1">Token Symbol:</label>
        <input
          type="text"
          id="tokenSymbol"
          name="tokenSymbol"
          value={formData.tokenSymbol.toUpperCase()}
          onChange={handleChange}
          placeholder="e.g., SOLDOGE"
          maxLength={8}
          className="input-field"
        />
        {errors.tokenSymbol && <p className="mt-1 text-red-400 text-sm">{errors.tokenSymbol}</p>}
      </div>
      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
          <Upload size={16} className="mr-2" />
          Upload Logo (500x500 PNG recommended):
        </label>
        <input 
          type="file" 
          id="logo" 
          name="logo" 
          onChange={handleLogoChange}
          accept="image/*"
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
        />
      </div>
      <div className="bg-background-dark/50 rounded-lg p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 text-secondary">Token Preview</h3>
        <TokenPreview
          name={formData.tokenName || "Your Token"}
          symbol={formData.tokenSymbol || "TOKEN"}
          logo={previewLogoUrl}
        />
      </div>
      <div className="flex justify-end mt-8">
        <button 
          className="btn btn-primary"
          onClick={handleNextStep}
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4 text-secondary">Token Configuration</h2>
      <div>
        <label htmlFor="decimals" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
          Decimals:
          <Info 
            size={16} 
            className="ml-2 text-gray-400 cursor-help" 
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
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="tokenSupply" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
          Token Supply:
          <Info 
            size={16} 
            className="ml-2 text-gray-400 cursor-help" 
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
          className="input-field"
        />
        {errors.tokenSupply && <p className="mt-1 text-red-400 text-sm">{errors.tokenSupply}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your token and its purpose..."
          className="input-field min-h-[120px]"
        />
        {errors.description && <p className="mt-1 text-red-400 text-sm">{errors.description}</p>}
      </div>
      <div className="flex justify-between mt-8">
        <button 
          className="btn btn-outline"
          onClick={handlePrevStep}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleNextStep}
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4 text-secondary">Creator and Security</h2>
      
      <div>
        <label htmlFor="creator" className="block text-sm font-medium text-gray-300 mb-1">
          Creator Name:
        </label>
        <input
          type="text"
          id="creator"
          name="creator"
          value={formData.creator}
          onChange={handleChange}
          placeholder="Your name or organization"
          className="input-field"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">
            Website:
          </label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            className="input-field"
          />
        </div>
        
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1">
            Twitter:
          </label>
          <input
            type="text"
            id="twitter"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            placeholder="https://twitter.com/yourusername"
            className="input-field"
          />
        </div>
        
        <div>
          <label htmlFor="telegram" className="block text-sm font-medium text-gray-300 mb-1">
            Telegram:
          </label>
          <input
            type="text"
            id="telegram"
            name="telegram"
            value={formData.telegram}
            onChange={handleChange}
            placeholder="https://t.me/yourcommunity"
            className="input-field"
          />
        </div>
        
        <div>
          <label htmlFor="discord" className="block text-sm font-medium text-gray-300 mb-1">
            Discord:
          </label>
          <input
            type="text"
            id="discord"
            name="discord"
            value={formData.discord}
            onChange={handleChange}
            placeholder="https://discord.gg/yourinvite"
            className="input-field"
          />
        </div>
      </div>
      
      <div className="bg-background-dark/50 rounded-lg p-4 mt-4">
        <h3 className="flex items-center text-lg font-semibold mb-3 text-secondary">
          <Shield size={18} className="mr-2" />
          Security Options
        </h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="revokeFreeze"
              name="revokeFreeze"
              checked={formData.revokeFreeze}
              onChange={handleChange}
              className="mt-1 mr-3"
            />
            <div>
              <label htmlFor="revokeFreeze" className="font-medium text-white">Revoke Freeze Authority</label>
              <p className="text-sm text-gray-400 mt-1">
                Permanently removes the ability to freeze token accounts. Recommended for decentralization.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <input
              type="checkbox"
              id="revokeMint"
              name="revokeMint"
              checked={formData.revokeMint}
              onChange={handleChange}
              className="mt-1 mr-3"
            />
            <div>
              <label htmlFor="revokeMint" className="font-medium text-white">Revoke Mint Authority</label>
              <p className="text-sm text-gray-400 mt-1">
                Permanently removes the ability to mint more tokens. Recommended for fixed supply tokens.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <input
              type="checkbox"
              id="revokeUpdate"
              name="revokeUpdate"
              checked={formData.revokeUpdate}
              onChange={handleChange}
              className="mt-1 mr-3"
            />
            <div>
              <label htmlFor="revokeUpdate" className="font-medium text-white">Revoke Update Authority</label>
              <p className="text-sm text-gray-400 mt-1">
                Permanently removes the ability to update token metadata. Recommended for decentralization.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-4">
        <h3 className="text-accent font-semibold mb-2 flex items-center">
          <Info size={18} className="mr-2" />
          Fee Information
        </h3>
        <p className="text-gray-300 text-sm">
          Creating a token requires a one-time fee of <span className="text-accent font-semibold">{TOKEN_CREATION_FEE} SOL</span> to cover network costs and service fees.
        </p>
        <p className="text-gray-300 text-sm mt-2">
          <strong>Note:</strong> You'll also need to pay for the Solana network transaction fees (approximately 0.01 SOL).
        </p>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
          <Info size={18} className="mr-2" />
          Metadata Storage Information
        </h3>
        <p className="text-gray-300 text-sm">
          Your token metadata and logo will be stored on Arweave via Metaplex, a permanent decentralized storage network.
          This ensures your token's information remains accessible and immutable.
        </p>
      </div>
      
      {errors.submit && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <button 
          className="btn btn-outline"
          onClick={handlePrevStep}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          className="btn btn-accent"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Token'}
        </button>
      </div>
      
      {loading && (
        <div className="mt-4">
          <div className="w-full bg-background-dark/70 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-300 mt-2">{uploadStatus}</p>
        </div>
      )}
    </div>
  );

  const renderSuccess = () => {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Token Created Successfully!</h2>
        <p className="text-gray-300 mb-6">
          Your token has been created and is now live on the Solana blockchain.
        </p>
        
        <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Token Mint Address</span>
            <button 
              onClick={() => navigator.clipboard.writeText(tokenAddress)}
              className="text-primary hover:text-primary-light text-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-sm font-mono break-all text-white">{tokenAddress}</p>
          <p className="text-xs text-gray-400 mt-2">
            This is your token's mint address. Use this to add your token to wallets and exchanges.
          </p>
        </div>
        
        {logoIpfsHash && (
          <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Logo IPFS Hash</span>
              <button 
                onClick={() => navigator.clipboard.writeText(logoIpfsHash)}
                className="text-primary hover:text-primary-light text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm font-mono break-all text-white">{logoIpfsHash}</p>
            
            <div className="mt-4 p-3 bg-background-dark/70 rounded-lg">
              <img 
                src={previewLogoUrl || logoUrl || ''} 
                alt="Token Logo" 
                className="w-24 h-24 mx-auto rounded-full object-cover"
              />
              
              {logoUrl && (
                <div className="mt-2 flex justify-center">
                  <a 
                    href={logoUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light text-xs flex items-center"
                  >
                    View on Arweave <ExternalLink size={12} className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {metadataIpfsHash && (
          <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Metadata IPFS Hash</span>
              <button 
                onClick={() => navigator.clipboard.writeText(metadataIpfsHash)}
                className="text-primary hover:text-primary-light text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm font-mono break-all text-white">{metadataIpfsHash}</p>
            
            {metadataUrl && (
              <div className="mt-2 flex justify-end">
                <a 
                  href={metadataUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light text-xs flex items-center"
                >
                  View Metadata <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            )}
            
            <div className="bg-background-dark/70 p-3 rounded-lg mt-3 text-left">
              <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                {JSON.stringify(createMetadataJson(logoUrl), null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {metadataTxId && (
          <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Metadata Transaction</span>
              <button 
                onClick={() => navigator.clipboard.writeText(metadataTxId)}
                className="text-primary hover:text-primary-light text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm font-mono break-all text-white">{metadataTxId}</p>
            
            <div className="mt-2 flex justify-end">
              <a 
                href={`https://explorer.solana.com/tx/${metadataTxId}?cluster=mainnet`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light text-xs flex items-center"
              >
                View Metadata Transaction <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        )}
        
        {revokeTxIds.mint && (
          <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Mint Authority Revocation</span>
              <button 
                onClick={() => navigator.clipboard.writeText(revokeTxIds.mint)}
                className="text-primary hover:text-primary-light text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm font-mono break-all text-white">{revokeTxIds.mint}</p>
            
            <div className="mt-2 flex justify-end">
              <a 
                href={`https://explorer.solana.com/tx/${revokeTxIds.mint}?cluster=mainnet`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light text-xs flex items-center"
              >
                View Transaction <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        )}
        
        {revokeTxIds.update && (
          <div className="bg-background-dark/50 rounded-lg p-4 mb-6 mx-auto max-w-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Update Authority Revocation</span>
              <button 
                onClick={() => navigator.clipboard.writeText(revokeTxIds.update)}
                className="text-primary hover:text-primary-light text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm font-mono break-all text-white">{revokeTxIds.update}</p>
            
            <div className="mt-2 flex justify-end">
              <a 
                href={`https://explorer.solana.com/tx/${revokeTxIds.update}?cluster=mainnet`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light text-xs flex items-center"
              >
                View Transaction <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href={explorerUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            View on Explorer
          </a>
          <button 
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setFormData({
                tokenName: "",
                tokenSymbol: "",
                logo: null,
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
                revokeUpdate: true
              });
              setMetadataUrl(null);
              setLogoUrl(null);
              setPreviewLogoUrl(null);
              setMetadataTxId(null);
              setLogoIpfsHash(null);
              setMetadataIpfsHash(null);
              setRevokeTxIds({});
            }}
            className="btn btn-primary"
          >
            Create Another Token
          </button>
        </div>
      </div>
    );
  };

  const renderFormSteps = () => {
    if (success) {
      return renderSuccess();
    }
    
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
      {!success && renderProgressIndicator()}
      <form onSubmit={(e) => e.preventDefault()}>
        {renderFormSteps()}
      </form>
    </div>
  );
};

export default TokenCreator;