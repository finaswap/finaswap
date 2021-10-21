const { WNATIVE_ADDRESS } = require("@finaswap/sdk")

module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()

  const factory = await ethers.getContract("UniswapV2Factory")
  const lounge = await ethers.getContract("FinaLounge")
  const fina = await ethers.getContract("FinaToken")
  
  let wethAddress;
  
  if (chainId === '31337') {
    wethAddress = (await deployments.get("WETH9Mock")).address
  } else if (chainId in WNATIVE_ADDRESS) {
    wethAddress = WNATIVE_ADDRESS[chainId]
  } else {
    throw Error("No WETH!")
  }

  await deploy("FinaChief", {
    from: deployer,
    args: [factory.address, lounge.address, fina.address, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("FinaChief")
  if (await maker.owner() !== dev) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["FinaChief"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FinaLounge", "FinaToken"]