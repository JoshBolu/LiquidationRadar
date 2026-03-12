// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IDemoOracle} from "./IDemoOracle.sol";

/**
 * @title DemoOracle
 * @notice Simple owner-controlled price oracle for hackathon demo.
 *         - Stores per-token USD prices with 8 decimals (1e8), like Chainlink/DIA.
 *         - Supports batch updates for Price Lab + Somnia Reactivity.
 *         - Emits a clean PriceUpdated event for frontend subscriptions.
 *
 * This is intentionally minimal and not production-grade.
 */
contract DemoOracle is IDemoOracle, Ownable {
    error DemoOracle__ArrayLengthMismatch();
    error DemoOracle__TokenPriceNotSet(address token);
    error DemoOracle__TokenNotAllowed(address token);
    error DemoOracle__PriceCannotBeZero();
    error DemoOracle__StepTooFrequent(uint256 nextAllowedAt);

    // token => price in USD with 8 decimals.
    mapping(address => uint256) private sPrices;
    mapping(address => bool) private sAllowedTokens;
    // user => last timestamp they called stepPrice
    mapping(address => uint256) private sLastStepAt;

    uint8 public constant DECIMALS = 8;
    uint256 private constant STEP_BPS = 500; // 5% in basis points
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant STEP_COOLDOWN = 2 minutes;

    // Emitted whenever the price for a token is updated.
    event PriceUpdated(address indexed updater, address indexed token, uint256 oldPrice, uint256 newPrice);

    constructor(address[] memory allowedTokens) Ownable(msg.sender) {
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            sAllowedTokens[allowedTokens[i]] = true;
        }
    }

    /// @inheritdoc IDemoOracle
    function getPrice(address token) external view returns (uint256 price) {
        price = sPrices[token];
        if (price == 0) {
            revert DemoOracle__TokenPriceNotSet(token);
        }
    }

    /// @inheritdoc IDemoOracle
    function getPrices(address[] calldata tokens) external view returns (uint256[] memory prices) {
        uint256 length = tokens.length;
        prices = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 price = sPrices[tokens[i]];
            if (price == 0) {
                revert DemoOracle__TokenPriceNotSet(tokens[i]);
            }
            prices[i] = price;
        }
    }

    function _setPrice(address token, uint256 newPrice) internal {
        if (newPrice == 0) {
            revert DemoOracle__PriceCannotBeZero();
        }
        if (!sAllowedTokens[token]) {
            revert DemoOracle__TokenNotAllowed(token);
        }
        uint256 oldPrice = sPrices[token];
        sPrices[token] = newPrice;
        emit PriceUpdated(msg.sender, token, oldPrice, newPrice);
    }

    /**
     * @notice Sets the price for a single token.
     * @dev Only callable by the owner (deployment script / Price Lab controller).
     */
    function setPrice(address token, uint256 newPrice) public onlyOwner {
        _setPrice(token, newPrice);
    }

    /**
     * @notice Batch update prices for multiple tokens in a single transaction.
     * @dev Length of tokens and prices arrays must match.
     */
    function setPrices(address[] calldata tokens, uint256[] calldata prices) external onlyOwner {
        if (tokens.length != prices.length) {
            revert DemoOracle__ArrayLengthMismatch();
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            _setPrice(tokens[i], prices[i]);
        }
    }

    /**
     * @notice Allows users to step the price up or down by 5%, at most once per 5 minutes per caller.
     * @dev Public Price Lab entrypoint; owner-only `setPrice` / `setPrices` are not rate-limited.
     */
    function stepPrice(address token, bool increase) external {
        uint256 last = sLastStepAt[msg.sender];
        if (last != 0 && block.timestamp < last + STEP_COOLDOWN) {
            revert DemoOracle__StepTooFrequent(last + STEP_COOLDOWN);
        }

        uint256 current = sPrices[token];
        if (current == 0) {
            revert DemoOracle__TokenPriceNotSet(token);
        }
        uint256 delta = (current * STEP_BPS) / BPS_DENOMINATOR;
        uint256 newPrice;
        if (increase) {
            newPrice = current + delta;
        } else {
            // Avoid underflow; clamp to minimum of 1
            newPrice = current > delta ? current - delta : 1;
        }

        sLastStepAt[msg.sender] = block.timestamp;
        _setPrice(token, newPrice);
    }
}
