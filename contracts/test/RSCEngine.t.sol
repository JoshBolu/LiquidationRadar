// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {RSCEngine} from "../src/RSCEngine.sol";
import {ReactiveSomniaCoin} from "../src/ReactiveSomniaCoin.sol";
import {DemoOracle} from "../src/oracle/DemoOracle.sol";
import {MockEth} from "../src/mocks/MockEth.sol";
import {MockBtc} from "../src/mocks/MockBtc.sol";
import {MockSomi} from "../src/mocks/MockSomi.sol";

contract RSCEngineTest is Test {
    RSCEngine engine;
    ReactiveSomniaCoin rsc;
    DemoOracle oracle;
    MockEth mockEth;
    MockBtc mockBtc;
    MockSomi mockSomi;

    address owner;
    address alice;
    address liquidator;

    uint256 constant PRICE_ETH_8 = 2_450e8;
    uint256 constant PRICE_BTC_8 = 64_200e8;
    uint256 constant PRICE_SOL_8 = 142e8;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        liquidator = makeAddr("liquidator");

        mockEth = new MockEth();
        mockBtc = new MockBtc();
        mockSomi = new MockSomi();

        address[] memory allowedTokens = new address[](3);
        allowedTokens[0] = address(mockEth);
        allowedTokens[1] = address(mockBtc);
        allowedTokens[2] = address(mockSomi);

        oracle = new DemoOracle(allowedTokens);
        oracle.setPrice(address(mockEth), PRICE_ETH_8);
        oracle.setPrice(address(mockBtc), PRICE_BTC_8);
        oracle.setPrice(address(mockSomi), PRICE_SOL_8);

        rsc = new ReactiveSomniaCoin();
        rsc.mint(liquidator, 10_000 ether);
        engine = new RSCEngine(allowedTokens, address(oracle), address(rsc));

        rsc.transferOwnership(address(engine));

        mockEth.mint(alice, 100 ether);
        mockBtc.mint(alice, 10 ether);
        mockSomi.mint(alice, 1000 ether);
        mockEth.mint(liquidator, 100 ether);
    }

    /* ---------- Constructor ---------- */

    function test_RevertWhen_Constructor_ZeroOracle() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(mockEth);
        vm.expectRevert(RSCEngine.RSCEngine__OracleCannotBeZero.selector);
        new RSCEngine(tokens, address(0), address(rsc));
    }

    /* ---------- depositCollateral ---------- */

    function test_DepositCollateral() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 1 ether);
        engine.depositCollateral(address(mockEth), 1 ether);
        vm.stopPrank();

        assertEq(engine.getCollateralBalanceOfUser(alice, address(mockEth)), 1 ether);
        assertEq(mockEth.balanceOf(address(engine)), 1 ether);
    }

    function test_RevertWhen_DepositCollateral_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(RSCEngine.RSCEngine__NeedsMoreThanZero.selector);
        engine.depositCollateral(address(mockEth), 0);
    }

    function test_RevertWhen_DepositCollateral_NotAllowedToken() public {
        address randomToken = makeAddr("random");
        vm.prank(alice);
        vm.expectRevert(RSCEngine.RSCEngine__NotAllowedToken.selector);
        engine.depositCollateral(randomToken, 1 ether);
    }

    /* ---------- mintDsc ---------- */

    function test_MintDsc_Success() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateral(address(mockEth), 2 ether);
        engine.mintDsc(2_000 ether);
        vm.stopPrank();

        assertEq(engine.getDscMinted(alice), 2_000 ether);
        assertEq(rsc.balanceOf(alice), 2_000 ether);
    }

    function test_MintDsc_RevertWhen_BreaksHealthFactor() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 1 ether);
        engine.depositCollateral(address(mockEth), 1 ether);
        vm.expectRevert();
        engine.mintDsc(2_000 ether);
        vm.stopPrank();
    }

    function test_RevertWhen_MintDsc_ZeroAmount() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 1 ether);
        engine.depositCollateral(address(mockEth), 1 ether);
        vm.expectRevert(RSCEngine.RSCEngine__NeedsMoreThanZero.selector);
        engine.mintDsc(0);
        vm.stopPrank();
    }

    /* ---------- depositCollateralAndMintDsc ---------- */

    function test_DepositCollateralAndMintDSC() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 2_000 ether);
        vm.stopPrank();

        assertEq(engine.getCollateralBalanceOfUser(alice, address(mockEth)), 2 ether);
        assertEq(engine.getDscMinted(alice), 2_000 ether);
        assertEq(rsc.balanceOf(alice), 2_000 ether);
    }

    /* ---------- redeemCollateral ---------- */

    function test_RedeemCollateral() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateral(address(mockEth), 2 ether);
        engine.redeemCollateral(address(mockEth), 1 ether);
        vm.stopPrank();

        assertEq(engine.getCollateralBalanceOfUser(alice, address(mockEth)), 1 ether);
        assertEq(mockEth.balanceOf(alice), 99 ether);
    }

    function test_RevertWhen_RedeemCollateral_BreaksHealthFactor() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 2_000 ether);
        vm.expectRevert();
        engine.redeemCollateral(address(mockEth), 2 ether);
        vm.stopPrank();
    }

    /* ---------- burnDsc / redeemCollateralForDsc ---------- */

    function test_RedeemCollateralForDsc() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 1_000 ether);
        rsc.approve(address(engine), 500 ether);
        engine.redeemCollateralForDsc(address(mockEth), 0.5 ether, 500 ether);
        vm.stopPrank();

        assertEq(engine.getDscMinted(alice), 500 ether);
        assertEq(engine.getCollateralBalanceOfUser(alice, address(mockEth)), 1.5 ether);
        assertEq(mockEth.balanceOf(alice), 98.5 ether);
    }

    /* ---------- getAccountInformation / getHealthFactor ---------- */

    function test_GetAccountInformation() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 1_000 ether);
        vm.stopPrank();

        (uint256 dscMinted, uint256 collateralValue) = engine.getAccountInformation(alice);
        assertEq(dscMinted, 1_000 ether);
        assertGt(collateralValue, 0);
    }

    function test_GetHealthFactor_NoDebt() public view {
        uint256 hf = engine.getHealthFactor(alice);
        assertEq(hf, type(uint256).max);
    }

    function test_GetHealthFactor_WithPosition() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 1_000 ether);
        vm.stopPrank();

        uint256 hf = engine.getHealthFactor(alice);
        assertGt(hf, 1e18);
    }

    /* ---------- liquidate ---------- */

    function test_Liquidate_Success() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 10 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 10 ether, 1_500 ether);
        vm.stopPrank();

        oracle.setPrice(address(mockEth), 200e8);
        uint256 hfBefore = engine.getHealthFactor(alice);
        assertLt(hfBefore, 1e18);

        vm.startPrank(liquidator);
        rsc.approve(address(engine), 200 ether);
        engine.liquidate(address(mockEth), alice, 200 ether);
        vm.stopPrank();

        assertGt(engine.getHealthFactor(alice), hfBefore);
        assertGt(mockEth.balanceOf(liquidator), 0);
    }

    function test_RevertWhen_Liquidate_HealthFactorOk() public {
        vm.startPrank(alice);
        mockEth.approve(address(engine), 2 ether);
        engine.depositCollateralAndMintDsc(address(mockEth), 2 ether, 1_000 ether);
        vm.stopPrank();

        vm.prank(liquidator);
        vm.expectRevert(RSCEngine.RSCEngine__HealthFactorOk.selector);
        engine.liquidate(address(mockEth), alice, 500 ether);
    }

    /* ---------- View helpers ---------- */

    function test_GetCollateralTokens() public view {
        address[] memory tokens = engine.getCollateralTokens();
        assertEq(tokens.length, 3);
        assertEq(tokens[0], address(mockEth));
        assertEq(tokens[1], address(mockBtc));
        assertEq(tokens[2], address(mockSomi));
    }

    function test_GetOracle() public view {
        assertEq(engine.getOracle(), address(oracle));
    }

    function test_GetUsdValue() public view {
        uint256 value = engine.getUsdValue(address(mockEth), 1 ether);
        assertEq(value, 2_450e18);
    }

    function test_GetTokenAmountFromUsd() public view {
        uint256 tokenAmount = engine.getTokenAmountFromUsd(address(mockEth), 2_450e18);
        assertEq(tokenAmount, 1 ether);
    }
}
