module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const fina = await deployments.get("FinaToken")

  await deploy("SushiBar", {
    from: deployer,
    args: [fina.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["SushiBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FinaToken"]
