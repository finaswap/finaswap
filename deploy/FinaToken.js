 module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy("FinaToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })
  
  const finaToken = await ethers.getContract("FinaToken")
  const finaTokenOwner = await finaToken.owner()
  await finaToken.mint(finaTokenOwner, "200000000000000000000000000")
}

module.exports.tags = ["FinaToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
