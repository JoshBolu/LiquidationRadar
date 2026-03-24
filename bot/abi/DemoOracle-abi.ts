export const DemoOracleAddress = "0x37d12f32b8a2f058935dBF8f6c27C676e0bC2aA7";

export const DemoOracleAbi = [
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      { name: "updater", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "oldPrice", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newPrice", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
