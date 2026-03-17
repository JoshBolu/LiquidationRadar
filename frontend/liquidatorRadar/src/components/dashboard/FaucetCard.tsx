import type { Address } from 'viem';
import SectionCard from '../shared/SectionCard';
import type { TokenBalance } from '../../hooks/useTokenBalances';

interface FaucetCardProps {
  tokens: TokenBalance[];
  mint: (tokenAddress: Address) => Promise<void>;
  pendingToken: Address | null;
}

const FaucetCard = ({ tokens, mint, pendingToken }: FaucetCardProps) => {
  const handleMint = async (tokenAddress: Address) => {
    await mint(tokenAddress);
  };

  return (
    <SectionCard title="Faucet">
      {tokens.length === 0 ? (
        <p className="text-slate-400 text-sm">
          Connect your wallet to mint test tokens.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {tokens.map((token) => {
            const isPending = pendingToken === token.address;
            return (
              <button
                key={token.id}
                type="button"
                disabled={isPending}
                onClick={() => handleMint(token.address)}
                className="flex-1 min-w-[140px] px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-sm font-semibold hover:border-brand-cyan transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <span>{token.symbol}</span>
                <span className="text-brand-cyan">
                  {isPending ? 'Minting...' : 'Mint'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default FaucetCard;

