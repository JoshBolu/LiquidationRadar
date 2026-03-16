// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DemoOracle} from "../src/oracle/DemoOracle.sol";
import {MockEth} from "../src/mocks/MockEth.sol";
import {MockBtc} from "../src/mocks/MockBtc.sol";
import {MockSomi} from "../src/mocks/MockSomi.sol";

contract DemoOracleTest is Test {
    DemoOracle oracle;

    address owner;
    address user;

    MockEth mockEth;
    MockBtc mockBtc;
    MockSomi mockSomi;

    uint256 constant PRICE_ETH_8 = 2_450e8;
    uint256 constant PRICE_BTC_8 = 64_200e8;
    uint256 constant PRICE_SOL_8 = 142e8;

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");

        mockEth = new MockEth();
        mockBtc = new MockBtc();
        mockSomi = new MockSomi();

        address[] memory tokens = new address[](3);
        tokens[0] = address(mockEth);
        tokens[1] = address(mockBtc);
        tokens[2] = address(mockSomi);

        uint256[] memory prices = new uint256[](3);
        prices[0] = 0; // mockEth: no initial price so test_RevertWhen_GetPrice_NotSet can use it
        prices[1] = PRICE_BTC_8;
        prices[2] = PRICE_SOL_8;

        oracle = new DemoOracle(tokens, prices);
    }

    /* ---------- getPrice / getPrices ---------- */

    function test_RevertWhen_GetPrice_NotSet() public {
        vm.expectRevert(abi.encodeWithSelector(DemoOracle.DemoOracle__TokenPriceNotSet.selector, address(mockEth)));
        oracle.getPrice(address(mockEth));
    }

    function test_SetPriceAndGetPrice() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        assertEq(oracle.getPrice(address(mockEth)), PRICE_ETH_8);
    }

    function test_GetPrices() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        oracle.setPrice(address(mockBtc), PRICE_BTC_8);
        oracle.setPrice(address(mockSomi), PRICE_SOL_8);

        address[] memory tokens = new address[](3);
        tokens[0] = address(mockEth);
        tokens[1] = address(mockBtc);
        tokens[2] = address(mockSomi);

        uint256[] memory prices = oracle.getPrices(tokens);
        assertEq(prices[0], PRICE_ETH_8);
        assertEq(prices[1], PRICE_BTC_8);
        assertEq(prices[2], PRICE_SOL_8);
    }

    /* ---------- setPrice (owner) ---------- */

    function test_RevertWhen_SetPrice_Zero() public {
        vm.expectRevert(DemoOracle.DemoOracle__PriceCannotBeZero.selector);
        oracle.setPrice(address(mockEth), 0);
    }

    function test_RevertWhen_SetPrice_NotAllowedToken() public {
        address randomToken = makeAddr("random");
        vm.expectRevert(abi.encodeWithSelector(DemoOracle.DemoOracle__TokenNotAllowed.selector, randomToken));
        oracle.setPrice(randomToken, PRICE_ETH_8);
    }

    function test_RevertWhen_NonOwnerSetPrice() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
    }

    /* ---------- setPrices (owner) ---------- */

    function test_SetPrices() public {
        address[] memory tokens = new address[](3);
        tokens[0] = address(mockEth);
        tokens[1] = address(mockBtc);
        tokens[2] = address(mockSomi);

        uint256[] memory prices = new uint256[](3);
        prices[0] = PRICE_ETH_8;
        prices[1] = PRICE_BTC_8;
        prices[2] = PRICE_SOL_8;

        oracle.setPrices(tokens, prices);

        assertEq(oracle.getPrice(address(mockEth)), PRICE_ETH_8);
        assertEq(oracle.getPrice(address(mockBtc)), PRICE_BTC_8);
        assertEq(oracle.getPrice(address(mockSomi)), PRICE_SOL_8);
    }

    function test_RevertWhen_SetPrices_ArrayLengthMismatch() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(mockEth);
        tokens[1] = address(mockBtc);

        uint256[] memory prices = new uint256[](3);
        prices[0] = PRICE_ETH_8;
        prices[1] = PRICE_BTC_8;
        prices[2] = PRICE_SOL_8;

        vm.expectRevert(DemoOracle.DemoOracle__ArrayLengthMismatch.selector);
        oracle.setPrices(tokens, prices);
    }

    /* ---------- stepPrice (public) ---------- */

    function test_StepPrice_Increase() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);

        oracle.stepPrice(address(mockEth), true);
        uint256 expected = PRICE_ETH_8 + (PRICE_ETH_8 * 5) / 100;
        assertEq(oracle.getPrice(address(mockEth)), expected);
    }

    function test_StepPrice_Decrease() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);

        oracle.stepPrice(address(mockEth), false);
        uint256 expected = PRICE_ETH_8 - (PRICE_ETH_8 * 5) / 100;
        assertEq(oracle.getPrice(address(mockEth)), expected);
    }

    function test_StepPrice_RevertWhen_PriceNotSet() public {
        vm.expectRevert(abi.encodeWithSelector(DemoOracle.DemoOracle__TokenPriceNotSet.selector, address(mockEth)));
        oracle.stepPrice(address(mockEth), true);
    }

    function test_StepPrice_RevertWhen_TooFrequent() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        oracle.stepPrice(address(mockEth), true);
        vm.expectRevert();
        oracle.stepPrice(address(mockEth), true);
    }

    function test_StepPrice_WorksAfterCooldown() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        oracle.stepPrice(address(mockEth), true);
        uint256 afterUp = oracle.getPrice(address(mockEth));
        vm.warp(block.timestamp + 2 minutes + 1);
        oracle.stepPrice(address(mockEth), false);
        uint256 afterDown = oracle.getPrice(address(mockEth));
        assertLt(afterDown, afterUp);
        assertGt(afterDown, PRICE_ETH_8 - (PRICE_ETH_8 * 5) / 100);
    }

    function test_StepPrice_EmitsPriceUpdated() public {
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        uint256 oldPrice = PRICE_ETH_8;
        uint256 newPrice = PRICE_ETH_8 + (PRICE_ETH_8 * 5) / 100;

        vm.expectEmit(true, true, true, true);
        emit DemoOracle.PriceUpdated(owner, address(mockEth), oldPrice, newPrice);
        oracle.stepPrice(address(mockEth), true);
    }

    /* ---------- Constants ---------- */

    function test_DECIMALS() public view {
        assertEq(oracle.DECIMALS(), 8);
    }
}
