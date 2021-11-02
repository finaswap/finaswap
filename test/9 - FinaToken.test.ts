import { ethers } from "hardhat";
import { expect } from "chai";

describe("FinaToken", function () {
  before(async function () {
    this.FinaToken = await ethers.getContractFactory("FinaToken")
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    this.fina = await this.FinaToken.deploy()
    await this.fina.deployed()
	
	const minterRole = await this.fina.MINTER_ROLE()
	await this.fina.grantRole(minterRole, this.fina.signer.address)
  })

  it("should have correct name and symbol and decimal", async function () {
    const name = await this.fina.name()
    const symbol = await this.fina.symbol()
    const decimals = await this.fina.decimals()
    expect(name, "FinaToken")
    expect(symbol, "FNA")
    expect(decimals, "18")
  })

  it("should only allow role members to mint token", async function () {
    await this.fina.mint(this.alice.address, "100")
    await this.fina.mint(this.bob.address, "1000")
    await expect(this.fina.connect(this.bob).mint(this.carol.address, "1000", { from: this.bob.address })).to.be.revertedWith(
      "revert FinaToken::mint: caller is not a minter"
    )
    const totalSupply = await this.fina.totalSupply()
    const aliceBal = await this.fina.balanceOf(this.alice.address)
    const bobBal = await this.fina.balanceOf(this.bob.address)
    const carolBal = await this.fina.balanceOf(this.carol.address)
    expect(totalSupply).to.equal("1100")
    expect(aliceBal).to.equal("100")
    expect(bobBal).to.equal("1000")
    expect(carolBal).to.equal("0")
  })

  it("should supply token transfers properly", async function () {
    await this.fina.mint(this.alice.address, "100")
    await this.fina.mint(this.bob.address, "1000")
    await this.fina.transfer(this.carol.address, "10")
    await this.fina.connect(this.bob).transfer(this.carol.address, "100", {
      from: this.bob.address,
    })
    const totalSupply = await this.fina.totalSupply()
    const aliceBal = await this.fina.balanceOf(this.alice.address)
    const bobBal = await this.fina.balanceOf(this.bob.address)
    const carolBal = await this.fina.balanceOf(this.carol.address)
    expect(totalSupply, "1100")
    expect(aliceBal, "90")
    expect(bobBal, "900")
    expect(carolBal, "110")
  })

  it("should fail if you try to do bad transfers", async function () {
    await this.fina.mint(this.alice.address, "100")
    await expect(this.fina.transfer(this.carol.address, "110")).to.be.revertedWith("revert FinaToken::_transferTokens: transfer amount exceeds balance")
    await expect(this.fina.connect(this.bob).transfer(this.carol.address, "1", { from: this.bob.address })).to.be.revertedWith("revert FinaToken::_transferTokens: transfer amount exceeds balance")
  })
})
