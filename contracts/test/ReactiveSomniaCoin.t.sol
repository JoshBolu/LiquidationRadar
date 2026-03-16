// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {ReactiveSomniaCoin} from "../src/ReactiveSomniaCoin.sol";

contract ReactiveSomniaCoinTest is Test {
    ReactiveSomniaCoin rsc;

    address owner;
    address recipient;
    uint256 constant MINT_AMOUNT = 1000 ether;

    function setUp() public {
        owner = address(this);
        recipient = makeAddr("recipient");
        rsc = new ReactiveSomniaCoin();
    }

    /* ---------- Constructor ---------- */

    function test_NameAndSymbol() public view {
        assertEq(rsc.name(), "ReactiveSomniaCoin");
        assertEq(rsc.symbol(), "RSC");
    }

    function test_OwnerIsDeployer() public view {
        assertEq(rsc.owner(), owner);
    }

    /* ---------- Mint (onlyOwner) ---------- */

    function test_Mint_Success() public {
        rsc.mint(recipient, MINT_AMOUNT);
        assertEq(rsc.balanceOf(recipient), MINT_AMOUNT);
        assertEq(rsc.totalSupply(), MINT_AMOUNT);
    }

    function test_Mint_ReturnsTrue() public {
        bool ok = rsc.mint(recipient, MINT_AMOUNT);
        assertTrue(ok);
    }

    function test_RevertWhen_MintToZeroAddress() public {
        vm.expectRevert(ReactiveSomniaCoin.ReactiveSomniaCoin__NotZeroAddress.selector);
        rsc.mint(address(0), MINT_AMOUNT);
    }

    function test_RevertWhen_MintZeroAmount() public {
        vm.expectRevert(ReactiveSomniaCoin.ReactiveSomniaCoin__MustBeMoreThanZero.selector);
        rsc.mint(recipient, 0);
    }

    function test_RevertWhen_NonOwnerMint() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert();
        rsc.mint(recipient, MINT_AMOUNT);
    }

    /* ---------- Burn (onlyOwner) ---------- */

    function test_Burn_Success() public {
        rsc.mint(owner, MINT_AMOUNT);
        uint256 burnAmount = 100 ether;
        rsc.burn(burnAmount);
        assertEq(rsc.balanceOf(owner), MINT_AMOUNT - burnAmount);
        assertEq(rsc.totalSupply(), MINT_AMOUNT - burnAmount);
    }

    function test_RevertWhen_BurnZeroAmount() public {
        rsc.mint(owner, MINT_AMOUNT);
        vm.expectRevert(ReactiveSomniaCoin.ReactiveSomniaCoin__MustBeMoreThanZero.selector);
        rsc.burn(0);
    }

    function test_RevertWhen_BurnExceedsBalance() public {
        rsc.mint(owner, 100 ether);
        vm.expectRevert(ReactiveSomniaCoin.ReactiveSomniaCoin__BurnAmountExceedsBalance.selector);
        rsc.burn(101 ether);
    }

    function test_RevertWhen_NonOwnerBurn() public {
        rsc.mint(owner, MINT_AMOUNT);
        vm.prank(makeAddr("stranger"));
        vm.expectRevert();
        rsc.burn(10 ether);
    }

    /* ---------- ERC20 basics ---------- */

    function test_Transfer() public {
        rsc.mint(owner, MINT_AMOUNT);
        require(rsc.transfer(recipient, 100 ether), "transfer failed");
        assertEq(rsc.balanceOf(owner), 900 ether);
        assertEq(rsc.balanceOf(recipient), 100 ether);
    }

    function test_ApproveAndTransferFrom() public {
        rsc.mint(owner, MINT_AMOUNT);
        address spender = makeAddr("spender");
        rsc.approve(spender, 50 ether);
        vm.prank(spender);
        require(rsc.transferFrom(owner, recipient, 50 ether), "transferFrom failed");
        assertEq(rsc.balanceOf(recipient), 50 ether);
        assertEq(rsc.balanceOf(owner), 950 ether);
    }
}
