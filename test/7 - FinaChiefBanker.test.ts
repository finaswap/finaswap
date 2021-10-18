import { ethers } from "hardhat";
const { keccak256, defaultAbiCoder } = require("ethers");
import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("FinaChiefBanker", function () {
  before(async function () {
    await prepare(this, ["FinaChiefBanker", "FinaLounge", "FinaChiefBankerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair", "FinaVaultV1", "BankerPairMediumRiskV1", "PeggedOracleV1"])
  })

  beforeEach(async function () {
    // Deploy ERC20 Mocks and Factory
    await deploy(this, [
      ["fina", this.ERC20Mock, ["FINA", "FINA", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    // Deploy Sushi and Banker contracts
    await deploy(this, [["lounge", this.FinaLounge, [this.fina.address]]])
    await deploy(this, [["vault", this.FinaVaultV1, [this.weth.address]]])
    await deploy(this, [["bankerMaster", this.BankerPairMediumRiskV1, [this.vault.address]]])
    await deploy(this, [["bankerMaker", this.FinaChiefBanker, [this.factory.address, this.lounge.address, this.vault.address, this.fina.address, this.weth.address, this.factory.pairCodeHash()]]])
    await deploy(this, [["exploiter", this.FinaChiefBankerExploitMock, [this.bankerMaker.address]]])
    await deploy(this, [["oracle", this.PeggedOracleV1]])
    // Create SLPs
    await createSLP(this, "finaEth", this.fina, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "finaUSDC", this.fina, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
    // Set Banker fees to Maker
    await this.bankerMaster.setFeeTo(this.bankerMaker.address)
    // Whitelist Banker on Vault
    await this.vault.whitelistMasterContract(this.bankerMaster.address, true)
    // Approve and make Vault token deposits
    await this.fina.approve(this.vault.address, getBigNumber(10))
    await this.dai.approve(this.vault.address, getBigNumber(10))
    await this.mic.approve(this.vault.address, getBigNumber(10))
    await this.usdc.approve(this.vault.address, getBigNumber(10))
    await this.weth.approve(this.vault.address, getBigNumber(10))
    await this.strudel.approve(this.vault.address, getBigNumber(10))
    await this.vault.deposit(this.fina.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.dai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.mic.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.usdc.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.weth.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.strudel.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    // Approve Banker to spend 'alice' Vault tokens
    await this.vault.setMasterContractApproval(this.alice.address, this.bankerMaster.address, true, "0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000")
    // **TO-DO - Initialize Banker Pair**
    //const oracleData = await this.oracle.getDataParameter("1")
    //const initData = defaultAbiCoder.encode(["address", "address", "address", "bytes"], [this.fina.address, this.dai.address, this.oracle.address, oracleData])
    //await this.vault.deploy(this.BankerMaster.address, initData, true)
  })

  describe("setBridge", function () {
    it("only allows the owner to set bridge", async function () {
      await expect(this.bankerMaker.connect(this.bob).setBridge(this.fina.address, this.weth.address, { from: this.bob.address })).to.be.revertedWith("Ownable: caller is not the owner")
    })
    
    it("does not allow to set bridge for Sushi", async function () {
      await expect(this.bankerMaker.setBridge(this.fina.address, this.weth.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.bankerMaker.setBridge(this.weth.address, this.fina.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.bankerMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.bankerMaker.setBridge(this.dai.address, this.fina.address))
        .to.emit(this.bankerMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.fina.address)
    })
  })
  
  describe("convert", function () {
    it("reverts if caller is not EOA", async function () {
      await expect(this.exploiter.convert(this.fina.address)).to.be.revertedWith("Maker: Must use EOA")
    })
  })
})
