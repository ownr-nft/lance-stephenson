const contract = require('@truffle/contract');

const contractBuildFiles = [
  require('../build/contracts/OwnrLSToken.json'),
  require('../build/contracts/OwnrLSAuction.json'),
];

const getTruffleContracts = (rpcAPI, primaryAccount) =>
  contractBuildFiles.reduce((contracts, { contractName, abi, networks }) => {
    const truffleContract = contract({ contractName, abi, networks });

    truffleContract.setProvider(rpcAPI);

    truffleContract.defaults({
      from: primaryAccount,
      gas: 10000000,
      gasPrice: 100000000000
    });

    return {
      ...contracts,
      [contractName]: truffleContract
    };
  }, {});

const setUpGlobalTestVariables = async (rpcAPI, primaryAccount) => {
  const contracts = getTruffleContracts(rpcAPI, primaryAccount);

  return {
    contracts,
    token: await contracts.OwnrLSToken.deployed(),
    auction: await contracts.OwnrLSAuction.deployed(),
  };
};

module.exports = {
  getTruffleContracts,
  setUpGlobalTestVariables,
};
