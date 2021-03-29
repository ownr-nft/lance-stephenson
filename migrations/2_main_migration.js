const {
  tokenName,
  tokenSymbol,
  auctionReserve,
} = require('../config');
const OwnrAuction = artifacts.require('./OwnrLSAuction.sol');
const OwnrToken = artifacts.require('./OwnrLSToken.sol');

module.exports = async (deployer) => {
  await deployer.deploy(OwnrToken, tokenName, tokenSymbol);

  const token = await OwnrToken.deployed();
  await deployer.deploy(OwnrAuction, token.address, auctionReserve);

  const auction = await OwnrAuction.deployed();
  await token.setAuctionContract(auction.address);
};
