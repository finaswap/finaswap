const {
  bytecode,
  abi,
} = require("../deployments/finatoken/FinaToken.json");

module.exports = async function ({
  ethers,
  getNamedAccounts,
  deployments,
  getChainId,
}) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  
  const name = "FinaToken";
  const symbol = "FNA";

  await deploy("FinaToken", {
    contract: {
      abi,
      bytecode,
    },
    from: deployer,
    args: [name, symbol],
    log: true,
    deterministicDeployment: false,
  });
};

module.exports.tags = ["FinaToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
