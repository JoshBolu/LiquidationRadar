import { useState } from "react";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import SectionCard from "../shared/SectionCard";
import { useAppStore } from "../../store/useAppStore";
import { RSCEngineAbi, RSCEngineAddress } from "../../contracts-abi/RSCEngine-abi";
import { somniaTestnet } from "../../data/mockTokens";
import { useToast } from "../../context/ToastContext";
import { getMeaningfulErrorMessage } from "../../utils/errorMessage";

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const WatchAddressCard = () => {
  const [address, setAddress] = useState("");
  const addWatchedAddress = useAppStore((s) => s.addWatchedAddress);
  const updateWatchedRowsFromSnapshots = useAppStore(
    (s) => s.updateWatchedRowsFromSnapshots,
  );
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAdd = async () => {
    const raw = address.trim();
    if (!raw) return;
    // Normalize address to 0x-prefixed lower-case
    let normalized = raw.toLowerCase();
    if (!normalized.startsWith("0x")) normalized = `0x${normalized}`;
    if (normalized.length !== 42) {
      addToast("Enter a valid 0x address", "error");
      return;
    }

    addWatchedAddress(normalized);
    setAddress("");

    try {
      const addr = normalized as Address;
      const [healthFactor, accountInfo] = await Promise.all([
        publicClient.readContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "getHealthFactor",
          args: [addr],
        }),
        publicClient.readContract({
          address: RSCEngineAddress,
          abi: RSCEngineAbi,
          functionName: "getAccountInformation",
          args: [addr],
        }),
      ]);
      const [totalDscMinted, collateralValueInUsd] = accountInfo as [bigint, bigint];
      updateWatchedRowsFromSnapshots([
        {
          address: addr as `0x${string}`,
          healthFactor: healthFactor as bigint,
          totalDscMinted,
          collateralValueInUsd,
        },
      ]);
    } catch (err) {
      addToast(getMeaningfulErrorMessage(err), "error");
    }
  };

  return (
    <SectionCard title="Watch Address" subtitle="Addresses update reactively on protocol events">
      <div className="flex space-x-2">
        <input
          className="flex-1 bg-brand-dark border-brand-border rounded-lg text-sm focus:ring-brand-cyan focus:border-brand-cyan text-slate-200 px-3 py-2"
          placeholder="0x..."
          type="text"
          value={address}
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-brand-cyan text-brand-dark font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>
    </SectionCard>
  );
};

export default WatchAddressCard;

