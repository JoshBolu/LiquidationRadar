// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockBtc is ERC20, Ownable {
    error MockBtc__MintNotInInterval();

    mapping(address user => uint256 lastMintedAt) private sUserLastMintedAt;
    uint256 private sInterval;
    uint256 private sMintAmount;

    constructor() ERC20("MockBTC", "mBTC") Ownable(msg.sender) {
        sInterval = 1 days;
        sMintAmount = 0.002 ether;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function setMintAmount(uint256 amount) external onlyOwner {
        sMintAmount = amount;
    }

    function getMintAmount() external view returns (uint256) {
        return sMintAmount;
    }

    function mintOnInterval() public {
        uint256 timeSinceLastMint = block.timestamp - sUserLastMintedAt[msg.sender];
        if (timeSinceLastMint < sInterval) {
            revert MockBtc__MintNotInInterval();
        }
        sUserLastMintedAt[msg.sender] = block.timestamp;
        _mint(msg.sender, sMintAmount);
    }
}
