#!/usr/bin/env bash
# Deploy with forge create (run from contracts/). Set RPC and account first.
set -e
RPC="${SOMNIA_TESTNET_RPC_URL:-$RPC_URL}"
ACC="${DEPLOY_ACCOUNT:-joshuaMain}"

echo "1. MockBtc"
MOCK_BTC=$(forge create src/mocks/MockBtc.sol:MockBtc --rpc-url "$RPC" --account "$ACC" --broadcast | grep "Deployed to:" | awk '{print $3}')
echo "MOCK_BTC=$MOCK_BTC"

echo "2. MockEth"
MOCK_ETH=$(forge create src/mocks/MockEth.sol:MockEth --rpc-url "$RPC" --account "$ACC" --broadcast | grep "Deployed to:" | awk '{print $3}')
echo "MOCK_ETH=$MOCK_ETH"

echo "3. MockSomi"
MOCK_SOMI=$(forge create src/mocks/MockSomi.sol:MockSomi --rpc-url "$RPC" --account "$ACC" --broadcast | grep "Deployed to:" | awk '{print $3}')
echo "MOCK_SOMI=$MOCK_SOMI"

echo "4. DemoOracle (allowedTokens + prices)"
DEMO_ORACLE=$(forge create src/oracle/DemoOracle.sol:DemoOracle \
  --rpc-url "$RPC" --account "$ACC" --broadcast \
  --constructor-args "[$MOCK_BTC,$MOCK_ETH,$MOCK_SOMI]" "[7397222000000,232958000000,19000000]" \
  | grep "Deployed to:" | awk '{print $3}')
echo "DEMO_ORACLE=$DEMO_ORACLE"

echo "5. ReactiveSomniaCoin"
RSC=$(forge create src/ReactiveSomniaCoin.sol:ReactiveSomniaCoin --rpc-url "$RPC" --account "$ACC" --broadcast | grep "Deployed to:" | awk '{print $3}')
echo "RSC=$RSC"

echo "6. RSCEngine"
RSC_ENGINE=$(forge create src/RSCEngine.sol:RSCEngine \
  --rpc-url "$RPC" --account "$ACC" --broadcast \
  --constructor-args "[$MOCK_BTC,$MOCK_ETH,$MOCK_SOMI]" "$DEMO_ORACLE" "$RSC" \
  | grep "Deployed to:" | awk '{print $3}')
echo "RSC_ENGINE=$RSC_ENGINE"

echo "7. transferOwnership(RSC -> RSCEngine)"
cast send "$RSC" "transferOwnership(address)" "$RSC_ENGINE" --rpc-url "$RPC" --account "$ACC"

echo "Done. RSC_ENGINE=$RSC_ENGINE"
