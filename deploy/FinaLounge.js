module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const fina = await deployments.get("FinaToken")

  await deploy("FinaLounge", {
    from: deployer,
    args: [fina.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["FinaLounge"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FinaToken"]
