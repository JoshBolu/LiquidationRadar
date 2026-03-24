export const RSCEngineAddress = "0x1dF5cEa012Eb727fc31b53B99606f08ca1F1827a";
export const RSCEngineAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "tokenAddresses", type: "address[]", internalType: "address[]" },
      { name: "oracleAddress", type: "address", internalType: "address" },
      { name: "rscAddress", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "burnRsc",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositCollateral",
    inputs: [
      {
        name: "tokenCollateralAddress",
        type: "address",
        internalType: "address",
      },
      { name: "amountCollateral", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositCollateralAndMintRsc",
    inputs: [
      {
        name: "tokenCollateralAddress",
        type: "address",
        internalType: "address",
      },
      { name: "amountCollateral", type: "uint256", internalType: "uint256" },
      { name: "amountRscToMint", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAccountCollateralValue",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "totalCollateralValueInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAccountInformation",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "totalRscMinted", type: "uint256", internalType: "uint256" },
      {
        name: "collateralValueInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollateralBalanceOfUser",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "token", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollateralTokens",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getHealthFactor",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "healthFactor", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOracle",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRscMinted",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTokenAmountFromUsd",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "usdAmountInWei", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUsdValue",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "liquidate",
    inputs: [
      { name: "collateral", type: "address", internalType: "address" },
      { name: "user", type: "address", internalType: "address" },
      { name: "debtToCover", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "mintRsc",
    inputs: [
      { name: "amountRscToMint", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemCollateral",
    inputs: [
      {
        name: "tokenCollateralAddress",
        type: "address",
        internalType: "address",
      },
      { name: "amountCollateral", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemCollateralForRsc",
    inputs: [
      {
        name: "tokenCollateralAddress",
        type: "address",
        internalType: "address",
      },
      { name: "amountCollateral", type: "uint256", internalType: "uint256" },
      { name: "amountRscToBurn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CollateralDeposited",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CollateralRedeemed",
    inputs: [
      {
        name: "redeemedFrom",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "redeemedTo",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Liquidated",
    inputs: [
      {
        name: "liquidator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "collateral",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "debtCovered",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralSeized",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RscBurned",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RscMinted",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "RSCEngine__BreaksHealthFactor",
    inputs: [
      { name: "userHealthFactor", type: "uint256", internalType: "uint256" },
    ],
  },
  { type: "error", name: "RSCEngine__HealthFactorNotImproved", inputs: [] },
  { type: "error", name: "RSCEngine__HealthFactorOk", inputs: [] },
  { type: "error", name: "RSCEngine__MintFailed", inputs: [] },
  { type: "error", name: "RSCEngine__NeedsMoreThanZero", inputs: [] },
  { type: "error", name: "RSCEngine__NotAllowedToken", inputs: [] },
  { type: "error", name: "RSCEngine__OracleCannotBeZero", inputs: [] },
  { type: "error", name: "RSCEngine__TransferFailed", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
];
