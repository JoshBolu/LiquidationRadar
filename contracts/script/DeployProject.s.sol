// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MockBtc} from "../src/mocks/MockBtc.sol";
import {MockEth} from "../src/mocks/MockEth.sol";
import {MockSomi} from "../src/mocks/MockSomi.sol";
import {RSCEngine} from "../src/RSCEngine.sol";
import {ReactiveSomniaCoin} from "../src/ReactiveSomniaCoin.sol";
import {DemoOracle} from "../src/oracle/DemoOracle.sol";

contract DeployProject is Script {
    function run() public {
        vm.startBroadcast();
        // Deploy the mock tokens
        MockBtc mockBtc = new MockBtc();
        MockEth mockEth = new MockEth();
        MockSomi mockSomi = new MockSomi();

        // make mock tokens into an array of allowed tokens
        address[] memory allowedTokens = new address[](3);
        allowedTokens[0] = address(mockBtc);
        allowedTokens[1] = address(mockEth);
        allowedTokens[2] = address(mockSomi);
        uint256[] memory prices = new uint256[](3);
        prices[0] = 7397222000000;
        prices[1] = 232958000000;
        prices[2] = 19000000;
        DemoOracle demoOracle = new DemoOracle(allowedTokens, prices);

        // Deploy the RSC token
        ReactiveSomniaCoin rsc = new ReactiveSomniaCoin();

        // Deploy the RSC engine
        RSCEngine rscEngine = new RSCEngine(allowedTokens, address(demoOracle), address(rsc));
        // transfer ownership of the RSC token to the RSC engine
        rsc.transferOwnership(address(rscEngine));
        vm.stopBroadcast();
    }
}
