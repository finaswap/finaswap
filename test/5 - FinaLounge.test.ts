import { ethers } from "hardhat";
import { expect } from "chai";

describe("FinaLounge", function () {
  before(async function () {
    this.FinaToken = await ethers.getContractFactory("FinaToken")
    this.FinaLounge = await ethers.getContractFactory("FinaLounge")

    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    this.fina = await this.FinaToken.deploy()
    this.lounge = await this.FinaLounge.deploy(this.fina.address)
	
	const minterRole = await this.fina.MINTER_ROLE()
	await this.fina.grantRole(minterRole, this.fina.signer.address)
		
    this.fina.mint(this.alice.address, "100")
    this.fina.mint(this.bob.address, "100")
    this.fina.mint(this.carol.address, "100")
  })

  it("should not allow enter if not enough approve", async function () {
    await expect(this.lounge.enter("100")).to.be.revertedWith("revert FinaToken::transferFrom: transfer amount exceeds spender allowance")
    await this.fina.approve(this.lounge.address, "50")
    await expect(this.lounge.enter("100")).to.be.revertedWith("revert FinaToken::transferFrom: transfer amount exceeds spender allowance")
    await this.fina.approve(this.lounge.address, "100")
    await this.lounge.enter("100")
    expect(await this.lounge.balanceOf(this.alice.address)).to.equal("100")
  })

  it("should not allow withraw more than what you have", async function () {
    await this.fina.approve(this.lounge.address, "100")
    await this.lounge.enter("100")
    await expect(this.lounge.leave("200")).to.be.revertedWith("ERC20: burn amount exceeds balance")
  })

  it("should work with more than one participant", async function () {
    await this.fina.approve(this.lounge.address, "100")
    await this.fina.connect(this.bob).approve(this.lounge.address, "100", { from: this.bob.address })
    // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
    await this.lounge.enter("20")
    await this.lounge.connect(this.bob).enter("10", { from: this.bob.address })
    expect(await this.lounge.balanceOf(this.alice.address)).to.equal("20")
    expect(await this.lounge.balanceOf(this.bob.address)).to.equal("10")
    expect(await this.fina.balanceOf(this.lounge.address)).to.equal("30")
    // FinaLounge get 20 more FNAs from an external source.
    await this.fina.connect(this.carol).transfer(this.lounge.address, "20", { from: this.carol.address })
    // Alice deposits 10 more FNAs. She should receive 10*30/50 = 6 shares.
    await this.lounge.enter("10")
    expect(await this.lounge.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.lounge.balanceOf(this.bob.address)).to.equal("10")
    // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
    await this.lounge.connect(this.bob).leave("5", { from: this.bob.address })
    expect(await this.lounge.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.lounge.balanceOf(this.bob.address)).to.equal("5")
    expect(await this.fina.balanceOf(this.lounge.address)).to.equal("52")
    expect(await this.fina.balanceOf(this.alice.address)).to.equal("70")
    expect(await this.fina.balanceOf(this.bob.address)).to.equal("98")
  })
})
