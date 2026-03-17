/**
 * Maps raw errors to short, user-friendly messages for toast display.
 */
export function getMeaningfulErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : "";
  const lower = raw.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied"))
    return "Transaction cancelled.";
  if (lower.includes("insufficient funds") || lower.includes("insufficient balance"))
    return "Insufficient funds for gas.";
  if (lower.includes("nonce") && lower.includes("too low"))
    return "Transaction replaced or already sent. Try again.";
  if (lower.includes("network") || lower.includes("econnrefused") || lower.includes("fetch"))
    return "Network error. Check your connection and try again.";
  if (lower.includes("wrong network") || lower.includes("chain"))
    return "Please switch to Somnia Testnet in your wallet.";
  if (lower.includes("connect your wallet") || lower.includes("no account"))
    return "Connect your wallet first.";
  if (lower.includes("execution reverted") || lower.includes("revert"))
    return "Transaction reverted. The contract rejected the call.";
  if (lower.includes("gas") && (lower.includes("exceed") || lower.includes("limit")))
    return "Gas limit too low. Please try again.";
  if (lower.includes("steptoo frequent") || lower.includes("step too frequent"))
    return "Price step cooldown: wait ~2 min between steps per token.";
  if (lower.includes("timeout") || lower.includes("deadline"))
    return "Request timed out. Please try again.";
  if (lower.includes("mint failed") || raw === "Mint failed")
    return "Mint failed. Please try again.";
  if (lower.includes("failed to fetch balances"))
    return "Could not load balances. Check network and try again.";

  return raw || "Something went wrong. Please try again.";
}
