module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const fina = await ethers.getContract("FinaToken")
  
  // TODO Set start and end block + bonus value (bonus value is probably the same as for SUSHI)
  const { address } = await deploy("FinaMaster", {
    from: deployer,
    args: [fina.address, dev, "1000000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  const minterRole = await fina.MINTER_ROLE()
  
  if (!await fina.hasRole(minterRole, address)) {
	// Grant minter role to FinaMaster
    console.log("Grant minter role to FinaMaster")
    await fina.grantRole(minterRole, address)
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