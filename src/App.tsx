import React from 'react';
import { Flame, ExternalLink, Wallet, ArrowRight, Coins, Mail } from 'lucide-react';
import TokenCreator from './components/TokenCreator';
import WalletButton from './components/WalletButton';
import WalletContextProvider from './components/WalletContextProvider';
import { useWallet } from '@solana/wallet-adapter-react';

function AppContent() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3">
            <Flame size={32} className="text-accent animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Meatsafe's Solana Token Forge
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://raydium.io/liquidity/create-pool/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink size={18} />
              <span className="hidden md:inline">Create Liquidity</span>
            </a>
            <a 
              href="https://raydium.io/portfolio/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink size={18} />
              <span className="hidden md:inline">Manage Liquidity</span>
            </a>
            <WalletButton />
          </div>
        </header>
        
        <main>
          {!connected ? (
            <section className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                  Create Your Solana Token
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                  Launch your own token on the Solana blockchain in minutes. 
                  No coding required. Fast, secure, and decentralized.
                </p>
              </div>
              
              <div className="card p-8 mb-12">
                <div className="flex flex-col items-center text-center mb-8">
                  <Wallet size={48} className="text-accent mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet to Begin</h2>
                  <p className="text-gray-300 mb-6">
                    To create your own Solana token, you'll need to connect your wallet first.
                    This allows us to sign and submit transactions on your behalf.
                  </p>
                  
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 max-w-2xl">
                    <p className="text-white font-medium">
                      Launch your Solana Meme Coin for a fraction the cost of Coinfast and others! Enjoy full control over your coin's authorities, social links, etc. for a flat rate of just 0.2 SOL!
                    </p>
                  </div>
                  
                  <WalletButton large />
                </div>
              </div>
              
              <div className="card p-8 mb-12">
                <h2 className="text-2xl font-bold mb-6 text-primary">How to Launch A Meme Coin</h2>
                <ol className="list-decimal pl-6 space-y-4 text-gray-300">
                  <li className="pl-2">Connect your Solana wallet.</li>
                  <li className="pl-2">Enter a token name and symbol, upload a 500x500 png for the logo.</li>
                  <li className="pl-2">Select the decimals quantity (9 is usually used for meme tokens).</li>
                  <li className="pl-2">Type in the total supply your token should have.</li>
                  <li className="pl-2">Write the description you want for your SPL Token.</li>
                  <li className="pl-2">On step 3 fill in the remaining details about your token.</li>
                  <li className="pl-2">Choose if you want to leave the revoke options turned on or off.</li>
                  <li className="pl-2">Click on Create, accept the transaction, and wait until your token is ready.</li>
                </ol>
              </div>
              
              <div className="token-creation-guide">
                <h2 className="text-2xl font-bold text-center mb-8 text-primary">
                  How to Create Your Token
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card p-6 relative pt-8">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
                      1
                    </div>
                    <h3 className="text-center text-lg font-semibold mb-3 text-accent">Design Your Token</h3>
                    <p className="text-center text-gray-300">
                      Choose a name, symbol, and upload a logo for your token. 
                      These details will be permanently stored on the blockchain.
                    </p>
                  </div>
                  
                  <div className="card p-6 relative pt-8">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
                      2
                    </div>
                    <h3 className="text-center text-lg font-semibold mb-3 text-accent">Configure Supply</h3>
                    <p className="text-center text-gray-300">
                      Set your token's total supply, decimals, and add a description.
                      Add social links to help others find your project.
                    </p>
                  </div>
                  
                  <div className="card p-6 relative pt-8">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-white">
                      3
                    </div>
                    <h3 className="text-center text-lg font-semibold mb-3 text-accent">Deploy to Blockchain</h3>
                    <p className="text-center text-gray-300">
                      Review your settings and deploy your token to the Solana blockchain.
                      You'll need SOL to pay for transaction fees.
                    </p>
                  </div>
                </div>
                
                <div className="mt-12 card p-6">
                  <h3 className="text-xl font-semibold mb-4 text-accent flex items-center">
                    After Launch
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <ArrowRight size={18} className="text-accent mt-1 mr-2 flex-shrink-0" />
                      <span>Create liquidity by adding your token to a DEX like Raydium or Orca</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight size={18} className="text-accent mt-1 mr-2 flex-shrink-0" />
                      <span>Submit your token to Solana explorers like Solscan and Solana FM</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight size={18} className="text-accent mt-1 mr-2 flex-shrink-0" />
                      <span>Build a community through social media and Discord</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          ) : (
            <section className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                  Create Your Solana Token
                </h1>
                {publicKey && (
                  <p className="text-lg text-gray-300 flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
                    Connected: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
                  </p>
                )}
              </div>
              
              <div className="card">
                <div className="p-6 md:p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <Coins size={24} className="text-accent" />
                    <h2 className="text-2xl font-bold text-white">Token Creator</h2>
                  </div>
                  <TokenCreator />
                </div>
              </div>
            </section>
          )}
        </main>
        
        <footer className="mt-20">
          <div className="text-center text-gray-400 text-sm mb-8">
            <p>© 2025 Meatsafe's Solana Token Forge. All rights reserved.</p>
            <p className="mt-2">Built with ❤️ for the Solana community</p>
            <div className="mt-4 flex justify-center">
              <a 
                href="mailto:meatsafemurdrer@gmail.com" 
                className="flex items-center text-primary hover:text-primary-light transition-colors"
              >
                <Mail size={16} className="mr-2" />
                Contact the Developer
              </a>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto bg-background-dark/50 rounded-lg p-6 border border-white/5 text-xs text-gray-400 leading-relaxed">
            <h4 className="font-semibold text-gray-300 mb-2 uppercase tracking-wider">Disclaimer</h4>
            <p className="mb-2">
              IMPORTANT: The information provided on this website does not constitute investment advice, financial advice, trading advice, or any other sort of advice. Meatsafe's Solana Token Forge does not recommend that any cryptocurrency should be bought, sold, or held by you.
            </p>
            <p className="mb-2">
              RISK WARNING: Cryptocurrency investments are subject to high market risk. Please make your investments cautiously. Meatsafe's Solana Token Forge will not be held liable for any investment losses you might incur as a result of using the information provided.
            </p>
            <p className="mb-2">
              VOLATILITY: Cryptocurrency prices are highly volatile and may fluctuate significantly in a short period of time. The value of your investment may decrease or increase significantly, and you may lose all of your investment.
            </p>
            <p className="mb-2">
              NO GUARANTEES: Creating a token does not guarantee any value, liquidity, or success. The success of any token depends on many factors including but not limited to marketing, community building, utility, and market conditions.
            </p>
            <p>
              LEGAL COMPLIANCE: Users are solely responsible for ensuring that their tokens comply with all applicable laws and regulations in their jurisdiction. Meatsafe's Solana Token Forge is a tool provider only and does not provide legal advice.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <AppContent />
    </WalletContextProvider>
  );
}

export default App;