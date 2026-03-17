import { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { useWallet } from '../../context/WalletContext';

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const Header = () => {
  const { address, setAddress } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const handleConnect = async () => {
    if (!window.ethereum || isConnecting) return;
    try {
      setIsConnecting(true);
      // Request accounts via EIP-1193
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = window.ethereum as any;
      await eth.request({ method: 'eth_requestAccounts' });

      const walletClient = createWalletClient({
        transport: custom(eth),
      });
      const [addr] = await walletClient.getAddresses();
      setAddress(addr ?? null);
    } catch (err) {
      console.error('Failed to connect wallet', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-brand-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-cyan rounded-md flex items-center justify-center">
            <svg
              className="h-5 w-5 text-brand-dark"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.450 0l-7 7a1 1 0 00.303 1.74l9 2a1 1 0 001.083-1.083l-2-9zM3.512 15.382l3-3a1 1 0 111.414 1.414l-3 3a1 1 0 11-1.414-1.414zM10 18a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Liquidation <span className="text-brand-cyan">Radar</span>
          </h1>
        </div>
        <span className="px-2 py-0.5 rounded border border-brand-cyan/30 text-brand-cyan text-xs font-semibold">
          Somnia Testnet
        </span>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-slate-400">
            REACTIVITY ENABLED - NO POLLING
          </span>
        </div>
        {shortAddress ? (
          <div className="bg-brand-card border border-brand-border px-4 py-2 rounded-lg flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-cyan to-blue-500 rounded-full" />
            <span className="font-mono text-sm tracking-widest text-slate-300">
              {shortAddress}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="bg-brand-cyan text-brand-dark font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

