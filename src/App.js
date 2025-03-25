import React from 'react';
import WalletConnect from './components/WalletConnect';
import MemeCoinForm from './components/MemeCoinForm';
import { Zap } from 'lucide-react';
import './App.css';

function App() {
  return (
    <WalletConnect>
      <div className="app-container">
        <header className="header">
          <div className="logo-container">
            <Zap size={32} color="#9945FF" />
            <h1 className="logo-text">SolanaTokenForge</h1>
          </div>
        </header>
        
        <main>
          <section className="hero-section">
            <h1 className="hero-title">Create Your Solana Token</h1>
            <p className="hero-subtitle">
              Launch your own token on the Solana blockchain in minutes. 
              No coding required. Fast, secure, and decentralized.
            </p>
          </section>
          
          <section className="token-form-container">
            <MemeCoinForm />
          </section>
        </main>
      </div>
    </WalletConnect>
  );
}

export default App;