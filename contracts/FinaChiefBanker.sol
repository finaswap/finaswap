// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "./libraries/SafeMath.sol";
import "./libraries/SafeERC20.sol";

import "./uniswapv2/interfaces/IUniswapV2Pair.sol";
import "./uniswapv2/interfaces/IUniswapV2Factory.sol";

import "./Ownable.sol";

interface IFinaVaultWithdraw {
    function withdraw(
        IERC20 token_,
        address from,
        address to,
        uint256 amount,
        uint256 share
    ) external returns (uint256 amountOut, uint256 shareOut);
}

interface IBankerWithdrawFee {
    function asset() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function withdrawFees() external;
    function removeAsset(address to, uint256 fraction) external returns (uint256 share);
}

// FinaChiefBanker is FinaMaster's left hand and kinda a wizard. He can cook up Fina from pretty much anything!
// This contract handles "serving up" rewards for xFina holders by trading tokens collected from Banker fees for Fina.
contract FinaChiefBanker is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IUniswapV2Factory private immutable factory;
    //0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac
    address private immutable lounge;
    //0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272
    IFinaVaultWithdraw private immutable finaVault;
    //0xF5BCE5077908a1b7370B9ae04AdC565EBd643966 
    address private immutable fina;
    //0x6B3595068778DD592e39A122f4f5a5cF09C90fE2
    address private immutable weth;
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    bytes32 private immutable pairCodeHash;
    //0xb5e5dc981b9ca7da2e24bd77420505f4dfaf584b996782257e69196a6dd7cdac

    mapping(address => address) private _bridges;

    event LogBridgeSet(address indexed token, address indexed bridge);
    event LogConvert(
        address indexed server,
        address indexed token0,
        uint256 amount0,
        uint256 amountVAULT,
        uint256 amountFNA
    );

    constructor(
        IUniswapV2Factory _factory,
        address _lounge,
        IFinaVaultWithdraw _finaVault,
        address _fina,
        address _weth,
        bytes32 _pairCodeHash
    ) public {
        factory = _factory;
        lounge = _lounge;
        finaVault = _finaVault;
        fina = _fina;
        weth = _weth;
        pairCodeHash = _pairCodeHash;
    }

    function setBridge(address token, address bridge) external onlyOwner {
        // Checks
        require(
            token != fina && token != weth && token != bridge,
            "Maker: Invalid bridge"
        );
        // Effects
        _bridges[token] = bridge;
        emit LogBridgeSet(token, bridge);
    }

    modifier onlyEOA() {
        // Try to make flash-loan exploit harder to do by only allowing externally-owned addresses.
        require(msg.sender == tx.origin, "Maker: Must use EOA");
        _;
    }

    function convert(IBankerWithdrawFee bankerPair) external onlyEOA {
        _convert(bankerPair);
    }

    function convertMultiple(IBankerWithdrawFee[] calldata bankerPair) external onlyEOA {
        for (uint256 i = 0; i < bankerPair.length; i++) {
            _convert(bankerPair[i]);
        }
    }

    function _convert(IBankerWithdrawFee bankerPair) private {
        // update Banker fees for this Maker contract (`feeTo`)
        bankerPair.withdrawFees();

        // convert updated Banker balance to Vault shares
        uint256 vaultShares = bankerPair.removeAsset(address(this), bankerPair.balanceOf(address(this)));

        // convert Vault shares to underlying Banker asset (`token0`) balance (`amount0`) for Maker
        address token0 = bankerPair.asset();
        (uint256 amount0, ) = finaVault.withdraw(IERC20(token0), address(this), address(this), 0, vaultShares);

        emit LogConvert(
            msg.sender,
            token0,
            amount0,
            vaultShares,
            _convertStep(token0, amount0)
        );
    }

    function _convertStep(address token0, uint256 amount0) private returns (uint256 finaOut) {
        if (token0 == fina) {
            IERC20(token0).safeTransfer(lounge, amount0);
            finaOut = amount0;
        } else if (token0 == weth) {
            finaOut = _swap(token0, fina, amount0, lounge);
        } else {
            address bridge = _bridges[token0];
            if (bridge == address(0)) {
                bridge = weth;
            }
            uint256 amountOut = _swap(token0, bridge, amount0, address(this));
            finaOut = _convertStep(bridge, amountOut);
        }
    }

    function _swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        address to
    ) private returns (uint256 amountOut) {
        (address token0, address token1) = fromToken < toToken ? (fromToken, toToken) : (toToken, fromToken);
        IUniswapV2Pair pair =
            IUniswapV2Pair(
                uint256(
                    keccak256(abi.encodePacked(hex"ff", factory, keccak256(abi.encodePacked(token0, token1)), pairCodeHash))
                )
            );
        
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        uint256 amountInWithFee = amountIn.mul(997);
        
        if (toToken > fromToken) {
            amountOut =
                amountInWithFee.mul(reserve1) /
                reserve0.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(0, amountOut, to, "");
        } else {
            amountOut =
                amountInWithFee.mul(reserve0) /
                reserve1.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(amountOut, 0, to, "");
        }
    }
}
