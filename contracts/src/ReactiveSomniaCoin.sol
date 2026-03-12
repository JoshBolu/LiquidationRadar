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

pragma solidity ^0.8.28;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * @title ReactiveSomniaCoin
 * @author Suyi-Ajayi Boluwatife
 * Collateral: Exogenous (ETH & BTC)
 * Minting: Algorithmic
 * Relative Stability: pegged to USD
 *
 * This is the contract meant to be governed by DSCEngine. This contract is just the ERC20 implementation of our stablecoin system
 */
contract ReactiveSomniaCoin is ERC20Burnable, Ownable {
    error ReactiveSomniaCoin__MustBeMoreThanZero();
    error ReactiveSomniaCoin__BurnAmountExceedsBalance();
    error ReactiveSomniaCoin__NotZeroAddress();

    constructor() ERC20("ReactiveSomniaCoin", "RSC") Ownable(msg.sender) {}

    function burn(uint256 _amount) public override onlyOwner {
        uint256 balance = balanceOf(msg.sender);
        if (_amount <= 0) {
            revert ReactiveSomniaCoin__MustBeMoreThanZero();
        }
        if (balance < _amount) {
            revert ReactiveSomniaCoin__BurnAmountExceedsBalance();
        }
        // basically "super" tells the code to use the burn function from the parent class(which in this case is the ERC20Burnable.sol)
        super.burn(_amount);
    }

    function mint(address _to, uint256 _amount) external onlyOwner returns (bool) {
        if (_to == address(0)) {
            revert ReactiveSomniaCoin__NotZeroAddress();
        }
        if (_amount <= 0) {
            revert ReactiveSomniaCoin__MustBeMoreThanZero();
        }
        _mint(_to, _amount);
        return true;
    }
}
