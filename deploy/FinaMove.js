const UNISWAP_ROUTER = new Map()
//UNISWAP_ROUTER.set("97", "0x648044250112fe8a89B3D3494c63df32737f9329")

module.exports = async function ({ getNamedAccounts, getChainId, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const chainId = await getChainId()

  if (!UNISWAP_ROUTER.has(chainId)) {
    throw Error("No Uniswap Router")
  }

  const uniswapRouterAddress = UNISWAP_ROUTER.get(chainId)

  const finaswapRouterAddress = (await deployments.get("UniswapV2Router02")).address

  await deploy("FinaMove", {
    from: deployer,
    args: [uniswapRouterAddress, finaswapRouterAddress],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["FinaMove"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
