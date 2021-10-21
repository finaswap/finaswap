const { ChainId } = require("@finaswap/sdk")


const FINA = {
	[ChainId.ROPSTEN]: '0x427A938f0C78e9e9D487e0EA0063Ebeb620b09aF'
}

module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()

  let finaAddress;

  if (chainId === '31337') {
    finaAddress = (await deployments.get("FinaToken")).address
  } else if (chainId in FINA) {
    finaAddress = FINA[chainId]
  } else {
    throw Error("No FINA!")
  }

  await deploy("FinaJuniorMasterV2", {
    from: deployer,
    args: [finaAddress],
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
