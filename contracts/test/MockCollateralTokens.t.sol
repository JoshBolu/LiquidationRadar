// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockEth} from "../src/mocks/MockEth.sol";
import {MockBtc} from "../src/mocks/MockBtc.sol";
import {MockSomi} from "../src/mocks/MockSomi.sol";

/**
 * @title MockCollateralTokensTest
 * @notice Unified tests for MockEth, MockBtc, and MockSomi (same logic, different contracts).
 */
contract MockCollateralTokensTest is Test {
    address owner;
    address user;

    MockEth mockEth;
    MockBtc mockBtc;
    MockSomi mockSomi;

    uint256 constant MINT_AMOUNT = 100 ether;

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");

        vm.warp(1 days + 1);

        mockEth = new MockEth();
        mockBtc = new MockBtc();
        mockSomi = new MockSomi();
    }

    /* ---------- Constructor & basics ---------- */

    function test_NamesAndSymbols() public view {
        assertEq(mockEth.name(), "MockETH");
        assertEq(mockEth.symbol(), "mETH");
        assertEq(mockBtc.name(), "MockBTC");
        assertEq(mockBtc.symbol(), "mBTC");
        assertEq(mockSomi.name(), "MockSOMI");
        assertEq(mockSomi.symbol(), "mSOMI");
    }

    function test_Decimals() public view {
        assertEq(mockEth.decimals(), 18);
        assertEq(mockBtc.decimals(), 18);
        assertEq(mockSomi.decimals(), 18);
    }

    /* ---------- owner mint ---------- */

    function test_OwnerMint_MockEth() public {
        mockEth.mint(user, MINT_AMOUNT);
        assertEq(mockEth.balanceOf(user), MINT_AMOUNT);
    }

    function test_OwnerMint_MockBtc() public {
        mockBtc.mint(user, MINT_AMOUNT);
        assertEq(mockBtc.balanceOf(user), MINT_AMOUNT);
    }

    function test_OwnerMint_MockSomi() public {
        mockSomi.mint(user, MINT_AMOUNT);
        assertEq(mockSomi.balanceOf(user), MINT_AMOUNT);
    }

    function test_RevertWhen_NonOwnerMint_MockEth() public {
        vm.prank(user);
        vm.expectRevert();
        mockEth.mint(user, MINT_AMOUNT);
    }

    function test_RevertWhen_NonOwnerMint_MockBtc() public {
        vm.prank(user);
        vm.expectRevert();
        mockBtc.mint(user, MINT_AMOUNT);
    }

    function test_RevertWhen_NonOwnerMint_MockSomi() public {
        vm.prank(user);
        vm.expectRevert();
        mockSomi.mint(user, MINT_AMOUNT);
    }

    /* ---------- mintOnInterval ---------- */

    function test_MintOnInterval_FirstCall_MockEth() public {
        mockEth.mintOnInterval();
        assertEq(mockEth.balanceOf(owner), 0.05 ether);
    }

    function test_MintOnInterval_FirstCall_MockBtc() public {
        mockBtc.mintOnInterval();
        assertEq(mockBtc.balanceOf(owner), 0.002 ether);
    }

    function test_MintOnInterval_FirstCall_MockSomi() public {
        mockSomi.mintOnInterval();
        assertEq(mockSomi.balanceOf(owner), 500 ether);
    }

    function test_MintOnInterval_RevertWhen_TooSoon_MockEth() public {
        mockEth.mintOnInterval();
        vm.expectRevert(MockEth.MockEth__MintNotInInterval.selector);
        mockEth.mintOnInterval();
    }

    function test_MintOnInterval_RevertWhen_TooSoon_MockBtc() public {
        mockBtc.mintOnInterval();
        vm.expectRevert(MockBtc.MockBtc__MintNotInInterval.selector);
        mockBtc.mintOnInterval();
    }

    function test_MintOnInterval_RevertWhen_TooSoon_MockSomi() public {
        mockSomi.mintOnInterval();
        vm.expectRevert(MockSomi.MockSomi__MintNotInInterval.selector);
        mockSomi.mintOnInterval();
    }

    function test_MintOnInterval_WorksAfterInterval_MockEth() public {
        mockEth.mintOnInterval();
        vm.warp(block.timestamp + 1 days + 1);
        mockEth.mintOnInterval();
        assertEq(mockEth.balanceOf(owner), 0.1 ether);
    }

    function test_MintOnInterval_WorksAfterInterval_MockBtc() public {
        mockBtc.mintOnInterval();
        vm.warp(block.timestamp + 1 days + 1);
        mockBtc.mintOnInterval();
        assertEq(mockBtc.balanceOf(owner), 0.004 ether);
    }

    function test_MintOnInterval_WorksAfterInterval_MockSomi() public {
        mockSomi.mintOnInterval();
        vm.warp(block.timestamp + 1 days + 1);
        mockSomi.mintOnInterval();
        assertEq(mockSomi.balanceOf(owner), 1000 ether);
    }

    function test_MintOnInterval_PerUserCooldown_MockEth() public {
        mockEth.mintOnInterval();
        vm.prank(user);
        mockEth.mintOnInterval();
        assertEq(mockEth.balanceOf(owner), 0.05 ether);
        assertEq(mockEth.balanceOf(user), 0.05 ether);
        vm.warp(block.timestamp + 1 days + 1);
        mockEth.mintOnInterval();
        assertEq(mockEth.balanceOf(owner), 0.1 ether);
    }

    function test_SetMintAmount() public {
        mockEth.setMintAmount(1 ether);
        assertEq(mockEth.getMintAmount(), 1 ether);
        mockEth.mintOnInterval();
        assertEq(mockEth.balanceOf(owner), 1 ether);
    }

    function test_RevertWhen_NonOwnerSetMintAmount_MockEth() public {
        vm.prank(user);
        vm.expectRevert();
        mockEth.setMintAmount(1 ether);
    }
}
