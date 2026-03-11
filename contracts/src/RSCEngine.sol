// SPDX-License-Identifier: SEE LICENSE IN LICENSE

// Layout of Contract:
// license
// version
// imports
// errors
// interfaces, libraries, contracts
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// internal & private view & pure functions
// external & public view & pure functions

pragma solidity ^0.8.18;

import {DecentralizedStableCoin} from "./DecentralizedStableCoin.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {OracleLib} from "./libraries/OracleLib.sol";

/*
 * @title DCSEngine
 * @author Suyi-Ajayi Boluwatife
 *
 * The System is designed to be as minimal as possible, and have the tokens maintain a 1 token == $1 peg.
 * This stabecoins has the properties:
 * - Exogenous Collateral
 * - Dollar pegged
 * - ALgorithmically stable
 * It is similar to DAI if DAI had no governance, no fee, and was only backed by WETH and WBTC
 *
 * Our DSC system should always be "overcollateralized". At no point, should the value of all collateral <= the $ backed value of all the DSC
 *
 * @notice THis contract is the core of the DSC system. It handles all the logic for mining and redeeming DSC, as well as depositing & withdrawing collateral.
 * @notice This contract is VERY loosely based on the MakerDAO DSS (DAI) sytem
 */

contract DSCEngine is ReentrancyGuard {
    /*//////////////
     * Errors
     /////////////*/
    error DSCEngine__NeedsMoreThanZero();
    error DSCEngine__TokenAddressesAndPriceFeedAdddressesMustBeSameLength();
    error DSCEngine__NotAllowedToken();
    error DSCEngine__TransferFailed();
    error DSCEngine__BreaksHealthFactor(uint256 userHealthFactor);
    error DSCEngine__MintFailed();
    error DSCEngine__HealthFactorOk();
    error DSCEngine__HealthFactorNotImproved();

    ////////////////////
    //// Types /////////
    ////////////////////
    using OracleLib for AggregatorV3Interface;

    /*//////////////
     * State variables
     /////////////*/
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    uint256 private constant LIQUIDATION_THRESHOLD = 50; // 200% overcollaterized
    uint256 private constant LIQUIDATION_PRECISION = 100;
    uint256 private constant MIN_HEALTH_FACTOR = 1e18;
    uint256 private constant LIQUIDATOR_BONUS = 10; // this means 10% bonus

    mapping(address token => address priceFeed) private priceFeeds; // tokenToPriceFeed
    mapping(address user => mapping(address token => uint256 amount)) private collateralDeposit;
    mapping(address user => uint256 amountDscMinted) private DscMinted;

    address[] private collateralTokens;

    DecentralizedStableCoin private i_dsc;

    /*//////////////
     * Events
     /////////////*/
    event CollateralDeposited(address indexed user, address indexed token, uint256 indexed amount);
    event CollateralRedeemed(
        address indexed redeemedFrom, address indexed redeemedTo, address indexed token, uint256 amount
    );

    /*//////////////
     * Modifiers
     /////////////*/
    modifier moreThanZero(uint256 amount) {
        if (amount == 0) {
            revert DSCEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address token) {
        if (priceFeeds[token] == address(0)) {
            revert DSCEngine__NotAllowedToken();
        }
        _;
    }

    /*//////////////
     * Functions
     /////////////*/

    constructor(address[] memory tokenAddresses, address[] memory priceFeedAddresses, address dscAddress) {
        // USD Price Feeds
        if (tokenAddresses.length != priceFeedAddresses.length) {
            revert DSCEngine__TokenAddressesAndPriceFeedAdddressesMustBeSameLength();
        }
        // for example ETH/USD, BTC/USD e.t.c
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            priceFeeds[tokenAddresses[i]] = priceFeedAddresses[i];
            collateralTokens.push(tokenAddresses[i]);
        }
        i_dsc = DecentralizedStableCoin(dscAddress);
    }

    ///////////////////////////////
    ///// External Functions //////
    ///////////////////////////////

    /*
    * @param tokenCollateralAddress The address of token to deposit as collateral
    * @param amountCollateral The amount of collateral to deposit
    * @param amountDscToMint the amount of decentralized stablecoin to mint
    * @notice this function will deposit your collateral and mint dsc in one transaction
    */
    function depositCollateralAndMintDSC(
        address tokenCollateralAddress,
        uint256 amountCollateral,
        uint256 amountDscToMint
    ) external {
        depositCollateral(tokenCollateralAddress, amountCollateral);
        mintDsc(amountDscToMint);
    }

    /*
     * @notice follows CEI(Checks Effects Interactions)
     * @param tokenCollateralAddress: The address of the token to deposit as collateral
     * @param amountCollateral: The amount of collateral to deposit
     */
    function depositCollateral(address tokenCollateralAddress, uint256 amountCollateral)
        public
        moreThanZero(amountCollateral)
        isAllowedToken(tokenCollateralAddress)
        nonReentrant
    {
        collateralDeposit[msg.sender][tokenCollateralAddress] += amountCollateral;
        emit CollateralDeposited(msg.sender, tokenCollateralAddress, amountCollateral);
        bool success = IERC20(tokenCollateralAddress).transferFrom(msg.sender, address(this), amountCollateral);
        if (!success) {
            revert DSCEngine__TransferFailed();
        }
    }

    /*
    * @param tokenCollateralAddress The collateral address to redeem
    * @param amountCollateral The amount of collateral to redeem
    * @param amountDscTOBurn The amount of DSC to burn
    * This function burns DSC and redeems underlying collateral in one transaction
    */
    function redeemCollateralForDsc(address tokenCollateralAddress, uint256 amountCollateral, uint256 amountDscToBurn)
        external
    {
        burnDsc(amountDscToBurn);
        redeemCollateral(tokenCollateralAddress, amountCollateral);
        // redeemCOllateral already checks health factor
    }

    // in order to redeem collateral:
    // 1. health factor must be over 1 after collateral pulled
    function redeemCollateral(address tokenCollateralAddress, uint256 amountCollateral)
        public
        moreThanZero(amountCollateral)
        nonReentrant
    {
        _redeemCollateral(msg.sender, msg.sender, tokenCollateralAddress, amountCollateral);
        _revertIfHealthFactorIsBroken(msg.sender);
    }

    /*
    * @notice follows CEI
    * @param amountDscToMint The amount of decentralized stablecoins to mint
    * @notice they must have more collateral value than the minimum threshold
    */
    function mintDsc(uint256 amountDscToMint) public moreThanZero(amountDscToMint) nonReentrant {
        DscMinted[msg.sender] += amountDscToMint;
        // If they minted too much ($150 DSC > $100 ETH)
        _revertIfHealthFactorIsBroken(msg.sender);
        bool minted = i_dsc.mint(msg.sender, amountDscToMint);
        if (!minted) {
            revert DSCEngine__MintFailed();
        }
    }

    function burnDsc(uint256 amount) public moreThanZero(amount) {
        _burnDsc(amount, msg.sender, msg.sender);
        _revertIfHealthFactorIsBroken(msg.sender); // i dont think this would ever hit....
    }

    // If we do start nearing undercollaterization, we need someone to liquidate position
    // $100 ETH backing and burns off the $50 DSC
    // $20 ETH back $50 DSC => DSC isn't worth $1!!!

    // $75 backing $50 DSC
    // Liquidator takes $75 backing and burns off the $50 DSC

    // If someone is almost undercollaterized, we will pay you to liquidate them from their collateral

    /*
    * @param collateral The erc20 collateral adddress to liquidate from the user
    * @param user The user who has broken the health factor. Their _healthFactor should be below MIN_HEALTH_FACTOR
    * @param debtToCover The amount of DSC you want to burn to improve the users health factor
    * @notice You can partially liquidate a user
    * @notice You will get liquidation bonus for liquidating the user
    * @notice This function working assumes protocol will be roughtly 200% overcollaterized in order for this to work
    * @notice A known bug would be if the protocol were 100% or less collaterized, then we wouldn't be able to incentivice the liquiidators
    * For example, if the price of the collateral plumetted before anyone could liquidate
    */
    function liquidate(address collateral, address user, uint256 debtToCover)
        external
        moreThanZero(debtToCover)
        nonReentrant
    {
        // need to check health factor of the user
        uint256 startingUserHealthFactor = _healthFactor(user);
        if (startingUserHealthFactor >= MIN_HEALTH_FACTOR) {
            revert DSCEngine__HealthFactorOk();
        }
        // we want to burn thier DSC "debt" and take their collateral
        // Bad user: $140 ETH, $100 DSC
        // debtToCover = $100
        // $100 of DSC == ??? ETH?
        uint256 tokenAmountFromDebtCovered = getTokenAmountFromUsd(collateral, debtToCover);
        // and give them 10% bonus, $110 of WETH for $100 DSC
        uint256 bonusCollateral = (tokenAmountFromDebtCovered * LIQUIDATOR_BONUS) / LIQUIDATION_PRECISION;
        uint256 totalCollateralToRedeem = tokenAmountFromDebtCovered + bonusCollateral;
        _redeemCollateral(user, msg.sender, collateral, totalCollateralToRedeem);
        _burnDsc(debtToCover, user, msg.sender);

        uint256 endingUserHealthFactor = _healthFactor(user);
        if (endingUserHealthFactor <= startingUserHealthFactor) {
            revert DSCEngine__HealthFactorNotImproved();
        }
        _revertIfHealthFactorIsBroken(msg.sender);
    }

    /*//////////////
     * Internal Functions
     /////////////*/

    function _getAccountInformation(address user)
        private
        view
        returns (uint256 totalDscMinted, uint256 collateralValueInUsd)
    {
        totalDscMinted = DscMinted[user];
        // we'll send 3000 as that's the amount we'll want to mint
        collateralValueInUsd = getAccountCollateralValue(user);
        // following the same example up 8000 would be returned
    }

    /*
    * Returns how close to liquidation a user is
    * if a user goes bellow 1, then they can get liquidated
    */
    function _healthFactor(address user) private view returns (uint256) {
        // total DSC minted
        // total collateral value
        (uint256 totalDscMinted, uint256 collateralValueInUsd) = _getAccountInformation(user);
        // give user infinite health factor if he has minted 0 DSC
        if (totalDscMinted == 0) {
            return type(uint256).max;
        }
        // totalDscMinted never get's to 0 from our code flow because of we update the DscMinted[user] with the value provided before calling the _revertIfHealthFactorIsBroken()
        // gets 3000000000000000000000 and 8000
        uint256 collateralAdjustedForThreshold = (collateralValueInUsd * LIQUIDATION_THRESHOLD) / LIQUIDATION_PRECISION; // we doing this because decimals dont work in solidity

        // 8000 * 50 = 400000e18 / 100 = 4000e18 = collateralAdjustedForThreshold - this is the ammount the person with $8000 is allowed to borrow

        // $150 ETH / 100 DSC (collateralInUsd / DSC)
        //  150 * 50 = 7500 / 100 = (75 / 100) < 1 - would be liquidated (would have an health factor of 75)
        return (collateralAdjustedForThreshold * PRECISION) / totalDscMinted;
        // 4000 * 1000000000000000000 = 4000000000000000000000 / 3000000000000000000000 = 1.3 which is > 1 so still safe
    }
    // 1. Check health factot(checks if they have enough collateral)
    // 2. Revert if they dont

    function _revertIfHealthFactorIsBroken(address user) public view {
        uint256 userHealthFactor = _healthFactor(user);
        if (userHealthFactor < MIN_HEALTH_FACTOR) {
            revert DSCEngine__BreaksHealthFactor(userHealthFactor);
        }
    }

    /////////////////////////////////////////
    // Public & External view Functions /////
    /////////////////////////////////////////

    /*
    * @dev Low-level internal function, don't call unless the function calling it is checking for health factor being broken
    */
    function _burnDsc(uint256 amountDscToBurn, address onBehalfOf, address dscFrom) internal {
        DscMinted[onBehalfOf] -= amountDscToBurn;
        bool success = i_dsc.transferFrom(dscFrom, address(this), amountDscToBurn);
        // This condition would be hypothetially unreachable cos the .transferFrom would throw it's own error if transfer fails
        if (!success) {
            revert DSCEngine__TransferFailed();
        }
        i_dsc.burn(amountDscToBurn);
    }

    function _redeemCollateral(address from, address to, address tokenCollateralAddress, uint256 amountCollateral)
        internal
    {
        collateralDeposit[from][tokenCollateralAddress] -= amountCollateral;
        emit CollateralRedeemed(from, to, tokenCollateralAddress, amountCollateral);

        bool success = IERC20(tokenCollateralAddress).transfer(to, amountCollateral);
        if (!success) {
            revert DSCEngine__TransferFailed();
        }
    }

    function getTokenAmountFromUsd(address token, uint256 usdAmountInWei) public view returns (uint256) {
        // price of ETH(token)
        // $/ETH ETH??
        // $2000 / ETH, $1000 = 0.5ETH
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        (, int256 price,,,) = priceFeed.staleCheckLatestRoundData();
        return (usdAmountInWei * PRECISION) / (uint256(price) * ADDITIONAL_FEED_PRECISION);
    }

    function getAccountCollateralValue(address user) public view returns (uint256 totalCollateralValueInUsd) {
        // loop through each collateral token, get the amount they have deposited, and map it to the price, to get the USD value
        for (uint256 i = 0; i < collateralTokens.length; i++) {
            address token = collateralTokens[i];
            uint256 amount = collateralDeposit[user][token];
            totalCollateralValueInUsd += getUsdValue(token, amount);
            // following our example $8000 will be returned
        }

        return totalCollateralValueInUsd;
        // if the 2ETH is the only collateral the person has then totalCollateralValueInUsd will return $8000
    }

    function getUsdValue(address token, uint256 amount) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        (, int256 price,,,) = priceFeed.staleCheckLatestRoundData();
        // 1 ETH = $100
        // The returned value from Cl will be 100 * 1e8
        return ((uint256(price) * ADDITIONAL_FEED_PRECISION) * amount) / PRECISION;

        // 1 ETH = $4000 and person has 2 ETH
        // ($4000) 400000000000 * 10000000000 = 4000000000000000000000 * 2 = 8000000000000000000000 / 1000000000000000000 = $8000
        // we'll be returning back 8000

        // 15 * 4000
    }

    function getAccountInformation(address user)
        external
        view
        returns (uint256 totalDscMinted, uint256 collateralValueInUsd)
    {
        (totalDscMinted, collateralValueInUsd) = _getAccountInformation(user);
    }

    function getHealthFactor(address user) external view returns (uint256 healthFactor) {
        healthFactor = _healthFactor(user);
    }

    function getDscMinted(address user) external view returns (uint256) {
        return DscMinted[user];
    }

    function getCollateralTokens() external view returns (address[] memory) {
        return collateralTokens;
    }

    function getCollateralTokenPriceFeed(address token) external view returns (address) {
        return priceFeeds[token];
    }

    function getCollateralBalanceOfUser(address user, address token) external view returns (uint256) {
        return collateralDeposit[user][token];
    }
}
