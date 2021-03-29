const { assert } = require('./setup');
const {
  tokenName,
  tokenSymbol,
} = require('../../config');

describe('OwnrLSToken', function () {
  describe('State', function () {
    it('should have a valid token name', async function () {
      return assert.equal(await this.token.name(), tokenName);
    });

    it('should have a valid token symbol', async function () {
      return assert.equal(await this.token.symbol(), tokenSymbol);
    });

    it('should have the correct auction contract linked', async function () {
      return assert.equal(await this.token.auctionContractAddress(), this.auction.address);
    });
  });
});
