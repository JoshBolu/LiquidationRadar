/**
 * Maps raw errors to short, user-friendly messages for toast display.
 */
export function getMeaningfulErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = raw.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied"))
    return "Transaction cancelled.";
  if (
    lower.includes("insufficient funds") ||
    lower.includes("insufficient balance")
  )
    return "Insufficient funds for gas.";
  if (lower.includes("nonce") && lower.includes("too low"))
    return "Transaction replaced or already sent. Try again.";
  if (
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch")
  )
    return "Network error. Check your connection and try again.";
  if (lower.includes("wrong network") || lower.includes("chain"))
    return "Please switch to Somnia Testnet in your wallet.";
  if (lower.includes("connect your wallet") || lower.includes("no account"))
    return "Connect your wallet first.";
  // -------- Contract-specific errors (DemoOracle, RSCEngine, Mock tokens) --------
  if (
    lower.includes("demooracle__tokenpricenotset") ||
    lower.includes("tokenpricenotset")
  )
    return "Oracle price not set for this token yet.";
  if (
    lower.includes("demooracle__tokennotallowed") ||
    lower.includes("tokennotallowed")
  )
    return "This token is not allowed in the oracle.";
  if (
    lower.includes("demooracle__pricecannotbezero") ||
    lower.includes("pricecannotbezero")
  )
    return "Oracle price must be greater than zero.";
  // Specific custom errors before generic revert handling
  if (
    lower.includes("demooracle__steptoofrequent") ||
    lower.includes("steptoofrequent") ||
    lower.includes("step too frequent")
  )
    return "Price step cooldown: wait ~2 min between steps per token.";
  if (
    lower.includes("rscengine__needsmorethanzero") ||
    lower.includes("needsmorethanzero")
  )
    return "Amount must be greater than zero.";
  if (
    lower.includes("rscengine__oraclecannotbezero") ||
    lower.includes("oraclecannotbezero")
  )
    return "Engine is misconfigured (oracle address is zero).";
  if (
    lower.includes("rscengine__notallowedtoken") ||
    lower.includes("notallowedtoken")
  )
    return "This token is not an allowed collateral type.";
  if (
    lower.includes("rscengine__transferfailed") ||
    lower.includes("transferfailed")
  )
    return "Token transfer failed. Check allowances and balances.";
  if (lower.includes("rscengine__mintfailed") || lower.includes("mintfailed"))
    return "Minting RSC failed. Please try again.";
  if (
    lower.includes("rscengine__healthfactorok") ||
    lower.includes("healthfactorok")
  )
    return "User's health factor is safe; cannot be liquidated.";
  if (
    lower.includes("rscengine__healthfactornotimproved") ||
    lower.includes("healthfactornotimproved")
  )
    return "Liquidation did not improve health factor; transaction reverted.";
  if (
    lower.includes("rscengine__breakshealthfactor") ||
    lower.includes("breakshealthfactor")
  )
    return "This action would break the minimum health factor requirement.";
  if (lower.includes("execution reverted") || lower.includes("revert"))
    return "Transaction reverted. The contract rejected the call.";
  if (
    lower.includes("gas") &&
    (lower.includes("exceed") || lower.includes("limit"))
  )
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
