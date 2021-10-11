module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const sushi = await ethers.getContract("FinaToken")
  
  const { address } = await deploy("FinaMaster", {
    from: deployer,
    args: [sushi.address, dev, "1000000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  if (await sushi.owner() !== address) {
    // Transfer Sushi Ownership to Chef
    console.log("Transfer Sushi Ownership to Chef")
    await (await sushi.transferOwnership(address)).wait()
  }

  const masterChef = await ethers.getContract("FinaMaster")
  if (await masterChef.owner() !== dev) {
    // Transfer ownership of FinaMaster to dev
    console.log("Transfer ownership of FinaMaster to dev")
    await (await masterChef.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["FinaMaster"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FinaToken"]
