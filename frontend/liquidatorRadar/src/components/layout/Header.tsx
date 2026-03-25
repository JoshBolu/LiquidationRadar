import { useState } from "react";
import { createWalletClient, custom } from "viem";
import { useWallet } from "../../context/WalletContext";

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
      await eth.request({ method: "eth_requestAccounts" });

      const walletClient = createWalletClient({
        transport: custom(eth),
      });
      const [addr] = await walletClient.getAddresses();
      setAddress(addr ?? null);
    } catch (err) {
      console.error("Failed to connect wallet", err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-brand-border px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img
          src="/img/liquidatorLogo.png"
          alt="Liquidation Radar"
          className="h-9 w-auto max-h-16 object-contain object-left sm:h-14"
        />
        <span className="px-2 py-0.5 rounded border border-brand-cyan/30 text-brand-cyan text-[11px] sm:text-xs font-semibold">
          Somnia Testnet
        </span>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-6">
        <div className="hidden sm:flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-slate-400">REACTIVITY ENABLED - NO POLLING</span>
        </div>

        {shortAddress ? (
          <>
            <div
              className="bg-brand-card border border-brand-border px-2 py-1 rounded-lg flex items-center gap-1 sm:hidden whitespace-nowrap"
              title={address ?? undefined}
              aria-label={address ? `Connected: ${address}` : "Connected"}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-brand-cyan to-blue-500 rounded-full" />
              <span className="font-mono text-[10px] tracking-widest text-slate-300 overflow-hidden text-ellipsis max-w-[98px]">
                {shortAddress}
              </span>
            </div>
            <div className="bg-brand-card border border-brand-border px-4 py-2 rounded-lg hidden sm:flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-brand-cyan to-blue-500 rounded-full" />
              <span className="font-mono text-sm tracking-widest text-slate-300">
                {shortAddress}
              </span>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="bg-brand-cyan text-brand-dark font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
            disabled={isConnecting}
          >
            <span className="hidden sm:inline">
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </span>
            <span className="sm:hidden inline-flex items-center justify-center w-8 h-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M3 7.5C3 6.12 4.12 5 5.5 5H20c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1H7.5C6.12 10 5 8.88 5 7.5V7h-.5C3.67 7 3 7.67 3 8.5V7.5ZM5.5 11H20v8H5.5A2.5 2.5 0 0 1 3 16.5v-5A2.5 2.5 0 0 1 5.5 9H20v1H5.5a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 5.5 19H19V12H5.5a1.5 1.5 0 0 0-1.5 1.5V17h-1v-4.5A2.5 2.5 0 0 1 5.5 10Z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
