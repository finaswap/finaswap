// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// FinaLounge is the coolest lounge in the office. You come in with some Fina, and leave with more! The longer you stay, the more Fina you get.
//
// This contract handles swapping to and from xFina, FinaSwap's staking token.
contract FinaLounge is ERC20("FinaLounge", "xFNA"){
    using SafeMath for uint256;
    IERC20 public fina;

    // Define the Fina token contract
    constructor(IERC20 _fina) public {
        fina = _fina;
    }

    // Enter the lounge. Pay some FNAs. Earn some shares.
    // Locks Fina and mints xFina
    function enter(uint256 _amount) public {
        // Gets the amount of Fina locked in the contract
        uint256 totalFina = fina.balanceOf(address(this));
        // Gets the amount of xFina in existence
        uint256 totalShares = totalSupply();
        // If no xFina exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalFina == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xFina the Fina is worth. The ratio will change overtime, as xFina is burned/minted and Fina deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalFina);
            _mint(msg.sender, what);
        }
        // Lock the Fina in the contract
        fina.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the lounge. Claim back your FNAs.
    // Unlocks the staked + gained Fina and burns xFina
    function leave(uint256 _share) public {
        // Gets the amount of xFina in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Fina the xFina is worth
        uint256 what = _share.mul(fina.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        fina.transfer(msg.sender, what);
    }
}
