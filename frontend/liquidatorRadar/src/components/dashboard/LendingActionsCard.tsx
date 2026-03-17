import { useState } from "react";
import { parseUnits } from "viem";
import type { Address } from "viem";
import SectionCard from "../shared/SectionCard";
import {
  MockBtcAddress,
  MockEthAddress,
  MockSomiAddress,
} from "../../contracts-abi/MockTokens-abi";
import { useLendingActions } from "../../hooks/useLendingActions";

type Tab = "DEPOSIT" | "MINT" | "BURN" | "REDEEM";

const TOKEN_OPTIONS = [
  { address: MockEthAddress as Address, symbol: "MOCK-ETH" },
  { address: MockBtcAddress as Address, symbol: "MOCK-BTC" },
  { address: MockSomiAddress as Address, symbol: "MOCK-SOMI" },
];

interface LendingActionsCardProps {
  userAddress: Address | null;
  onSuccess?: () => void;
}

export default function LendingActionsCard({
  userAddress,
  onSuccess,
}: LendingActionsCardProps) {
  const [tab, setTab] = useState<Tab>("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Address>(MockEthAddress as Address);

  const { approve, depositCollateral, mintDsc, burnDsc, redeemCollateral, pending } =
    useLendingActions(userAddress);

  const handleSubmit = async () => {
    if (!userAddress || !amount || parseFloat(amount) <= 0) return;
    const decimals = 18;
    const amountWei = parseUnits(amount, decimals);

    try {
      if (tab === "DEPOSIT") {
        await approve(token, amountWei);
        await depositCollateral(token, amountWei);
      } else if (tab === "MINT") {
        await mintDsc(amountWei);
      } else if (tab === "BURN") {
        await burnDsc(amountWei);
      } else if (tab === "REDEEM") {
        await redeemCollateral(token, amountWei);
      }
      setAmount("");
      onSuccess?.();
    } catch {
      // Toast handled in hook
    }
  };

  const isPending = !!pending;
  const canSubmit =
    userAddress && amount && parseFloat(amount) > 0 && !isPending;

  return (
    <SectionCard title="Lending Actions">
      <div className="flex border-b border-brand-border bg-brand-dark/30 gap-1">
        {(["DEPOSIT", "MINT", "BURN", "REDEEM"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-brand-cyan text-brand-cyan bg-brand-cyan/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "BURN" ? "Burn RSC" : t === "MINT" ? "Mint RSC" : t}
          </button>
        ))}
      </div>
      <div className="p-5 space-y-4">
        {(tab === "DEPOSIT" || tab === "REDEEM") && (
          <div>
            <label className="text-xs text-slate-400 block mb-2">Token</label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value as Address)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg text-sm text-slate-200 px-3 py-2"
            >
              {TOKEN_OPTIONS.map((t) => (
                <option key={t.symbol} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400 block mb-2">
            {tab === "DEPOSIT" && "Collateral amount"}
            {tab === "MINT" && "RSC amount to mint"}
            {tab === "BURN" && "RSC amount to burn (repay)"}
            {tab === "REDEEM" && "Collateral amount to redeem"}
          </label>
          <input
            className="w-full bg-brand-dark border border-brand-border rounded-lg text-sm text-slate-200 px-3 py-2"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 bg-brand-cyan text-brand-dark font-bold rounded-lg uppercase tracking-wider text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isPending ? pending : tab === "MINT" ? "Mint RSC" : tab === "BURN" ? "Burn RSC" : tab}
        </button>
      </div>
    </SectionCard>
  );
}
