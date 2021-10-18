module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const fina = await ethers.getContract("FinaToken")
  
  const { address } = await deploy("FinaMaster", {
    from: deployer,
    args: [fina.address, dev, "1000000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  if (await fina.owner() !== address) {
    // Transfer Fina Ownership to Chef
    console.log("Transfer Fina Ownership to Chef")
    await (await fina.transferOwnership(address)).wait()
  }

  const finaMaster = await ethers.getContract("FinaMaster")
  if (await finaMaster.owner() !== dev) {
    // Transfer ownership of FinaMaster to dev
    console.log("Transfer ownership of FinaMaster to dev")
    await (await finaMaster.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["FinaMaster"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FinaToken"]
