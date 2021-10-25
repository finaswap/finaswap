const { ChainId } = require("@finaswap/sdk")

module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()
  
  const fina = await ethers.getContract("FinaToken")
  
  await deploy("FinaJuniorMasterV2", {
    from: deployer,
    args: [fina.address],
    log: true,
    deterministicDeployment: false
  })

  const finaJuniorMasterV2 = await ethers.getContract("FinaJuniorMasterV2")
  if (await finaJuniorMasterV2.owner() !== dev) {
    console.log("Transfer ownership of FinaJuniorMaster to dev")
    await (await finaJuniorMasterV2.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["FinaJuniorMasterV2"]
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
