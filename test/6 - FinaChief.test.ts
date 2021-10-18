import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("FinaChief", function () {
  before(async function () {
    await prepare(this, ["FinaChief", "SushiBar", "FinaChiefExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["sushi", this.ERC20Mock, ["FINA", "FINA", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.SushiBar, [this.sushi.address]]])
    await deploy(this, [["finaChief", this.FinaChief, [this.factory.address, this.bar.address, this.sushi.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.FinaChiefExploitMock, [this.finaChief.address]]])
    await createSLP(this, "sushiEth", this.sushi, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "sushiUSDC", this.sushi, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Sushi", async function () {
      await expect(this.finaChief.setBridge(this.sushi.address, this.weth.address)).to.be.revertedWith("FinaChief: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.finaChief.setBridge(this.weth.address, this.sushi.address)).to.be.revertedWith("FinaChief: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.finaChief.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("FinaChief: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.finaChief.setBridge(this.dai.address, this.sushi.address))
        .to.emit(this.finaChief, "LogBridgeSet")
        .withArgs(this.dai.address, this.sushi.address)
    })
  })
  describe("convert", function () {
    it("should convert FINA - ETH", async function () {
      await this.sushiEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convert(this.sushi.address, this.weth.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushiEth.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convert(this.usdc.address, this.weth.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convert(this.strudel.address, this.weth.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - FINA", async function () {
      await this.sushiUSDC.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convert(this.usdc.address, this.sushi.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushiUSDC.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convert(this.dai.address, this.weth.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.setBridge(this.usdc.address, this.sushi.address)
      await this.finaChief.setBridge(this.mic.address, this.usdc.address)
      await this.finaChief.convert(this.mic.address, this.usdc.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.setBridge(this.usdc.address, this.sushi.address)
      await this.finaChief.setBridge(this.dai.address, this.usdc.address)
      await this.finaChief.convert(this.dai.address, this.usdc.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.setBridge(this.dai.address, this.usdc.address)
      await this.finaChief.setBridge(this.mic.address, this.dai.address)
      await this.finaChief.convert(this.dai.address, this.mic.address)
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.setBridge(this.dai.address, this.mic.address)
      await this.finaChief.setBridge(this.mic.address, this.dai.address)
      await expect(this.finaChief.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.sushiEth.transfer(this.finaChief.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.sushi.address, this.weth.address)).to.be.revertedWith("FinaChief: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.finaChief.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("FinaChief: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.finaChief.address, getBigNumber(1))
      await expect(this.finaChief.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("FinaChief: Cannot convert")
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.finaChief.address)).to.equal(getBigNumber(1))
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.sushiEth.transfer(this.finaChief.address, getBigNumber(1))
      await this.finaChief.convertMultiple([this.dai.address, this.sushi.address], [this.weth.address, this.weth.address])
      expect(await this.sushi.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.finaChief.address)).to.equal(0)
      expect(await this.sushi.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
