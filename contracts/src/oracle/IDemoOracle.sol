// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

interface IDemoOracle {
    function getPrice(address token) external view returns (uint256 price);

    function getPrices(address[] calldata tokens) external view returns (uint256[] memory prices);
}
