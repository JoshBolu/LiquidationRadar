import { engine } from "./contracts";

const ONE_HEALTH_FACTOR = 10n ** 18n;
const LIQUIDATION_BONUS = 10n;
const PERCENT_BASE = 100n;

let cachedCollateralTokens: string[] | null = null;

async function getCollateralTokens(): Promise<string[]> {
  if (cachedCollateralTokens && cachedCollateralTokens.length > 0) {
    return cachedCollateralTokens;
  }

  const tokens = (await engine.getCollateralTokens()) as string[];
  cachedCollateralTokens = tokens.map((token) => token.toLowerCase());
  return cachedCollateralTokens;
}

export async function tryLiquidateUser(
  user: string,
  prefetchedHealthFactor?: bigint,
): Promise<void> {
  try {
    const healthFactor =
      prefetchedHealthFactor ?? ((await engine.getHealthFactor(user)) as bigint);
    if (healthFactor >= ONE_HEALTH_FACTOR) {
      console.log(`[liquidator] skip ${user} (health factor is safe)`);
      return;
    }

    const totalDebt = (await engine.getDscMinted(user)) as bigint;
    if (totalDebt === 0n) {
      console.log(`[liquidator] skip ${user} (minted is 0)`);
      return;
    }

    const collateralTokens = await getCollateralTokens();
    const balances = (await Promise.all(
      collateralTokens.map((token) => engine.getCollateralBalanceOfUser(user, token)),
    )) as bigint[];

    const usdValues = (await Promise.all(
      collateralTokens.map((token, index) => {
        const amount = balances[index] as bigint;
        if (amount === 0n) return Promise.resolve(0n);
        return engine.getUsdValue(token, amount);
      }),
    )) as bigint[];

    let bestToken = "";
    let bestValue = 0n;
    for (let i = 0; i < collateralTokens.length; i += 1) {
      const usdValue = usdValues[i] as bigint;
      if (usdValue > bestValue) {
        bestValue = usdValue;
        bestToken = collateralTokens[i] as string;
      }
    }

    if (bestValue === 0n || !bestToken) {
      console.log(`[liquidator] skip ${user} (no collateral value found)`);
      return;
    }

    const maxDebtCoverable =
      (bestValue * PERCENT_BASE) / (PERCENT_BASE + LIQUIDATION_BONUS);
    const debtToCover = totalDebt < maxDebtCoverable ? totalDebt : maxDebtCoverable;
    if (debtToCover === 0n) {
      console.log(`[liquidator] skip ${user} (computed debtToCover is 0)`);
      return;
    }

    try {
      const tx = await engine.liquidate(bestToken, user, debtToCover);
      console.log(
        `[liquidator] liquidation sent user=${user} collateral=${bestToken} debtToCover=${debtToCover.toString()} tx=${tx.hash}`,
      );

      const receipt = await tx.wait();
      console.log(
        `[liquidator] liquidation confirmed user=${user} collateral=${bestToken} block=${receipt?.blockNumber ?? "n/a"}`,
      );
    } catch (error) {
      console.error(
        `[liquidator] liquidation failed user=${user} collateral=${bestToken} debtToCover=${debtToCover.toString()}`,
        error,
      );
    }
  } catch (error) {
    console.error(`[liquidator] liquidation failed user=${user}`, error);
  }
}

export async function checkAndLiquidateUsers(users: Set<string>): Promise<void> {
  const userList = Array.from(users);
  if (userList.length === 0) {
    return;
  }

  const healthFactors = (await Promise.all(
    userList.map((user) => engine.getHealthFactor(user)),
  )) as bigint[];

  for (let i = 0; i < userList.length; i += 1) {
    const user = userList[i];
    const healthFactor = healthFactors[i] as bigint;

    if (healthFactor < ONE_HEALTH_FACTOR) {
      console.log(`[health] unhealthy user=${user} healthFactor=${healthFactor.toString()}`);
      await tryLiquidateUser(user, healthFactor);
    }
  }
}
