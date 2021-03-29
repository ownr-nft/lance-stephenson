const Promise = require('bluebird');
const { time } = require('@openzeppelin/test-helpers');
const { assert } = require('./setup');
const { default: BigNumber } = require('bignumber.js');
const { auctionReserve } = require('../../config');

describe('OwnrLSAuction', function () {
  describe('State', function () {
    it('should have the correct token contract linked', async function () {
      return assert.equal(await this.auction.tokenContract(), this.token.address);
    });

    it('should have the auction initial timer properly set', async function () {
      return assert.equal(new BigNumber(await this.auction.auctionEndTime()).toFixed(0), 0);
    });

    it('should have the auction initial biddings properly set', async function () {
      assert.equal(new BigNumber(await this.auction.highestBidAmount()).toFixed(0), 0);
      return assert.equal((await this.auction.highestBidder()).toLowerCase(), '0x0000000000000000000000000000000000000000');
    });
  });

  describe('Methods', function () {
    it('should allow owner to set finance address', async function () {
      // Shift index by 1 since the 0-index is used as primary sender
      await this.auction.setFinanceAddress(this.financeAddress);
      assert.equal((await this.auction.financeAddress()).toLowerCase(), this.financeAddress);
    });

    it('should not allow users to bid lower than or equal to the reserve', function () {
      return assert.isRejected(
        this.auction.sendTransaction({
          from: this.mainAccount,
          to: this.auction.address,
          value: auctionReserve,
        })
      );
    });

    it('should allow users with sufficient funds to bid and start the auction', async function () {
      // Bid using larger amount of funds than the reserve as the first bidder
      const bidAmount = new BigNumber(auctionReserve).plus(new BigNumber('1e10'));

      await this.auction.sendTransaction({
        from: this.subAccount,
        to: this.auction.address,
        value: bidAmount,
      });

      // Confirm the auction timers
      assert.notEqual(new BigNumber(await this.auction.auctionEndTime()).toFixed(0), new BigNumber(0).toFixed(0));

      // Confirm the top bidding
      assert.equal(new BigNumber(await this.auction.highestBidAmount()).toFixed(0), bidAmount);
      return assert.equal((await this.auction.highestBidder()).toLowerCase(), this.subAccount);
    });

    it('should not allow users to bid below or equal to the current top bidding', async function () {
      const topAmount = new BigNumber(await this.auction.highestBidAmount());

      return assert.isRejected(
        this.auction.sendTransaction({
          from: this.mainAccount,
          to: this.auction.address,
          value: topAmount,
        })
      );
    });

    it('should refund previous top bidder when outbid', async function () {
      const preBalance = new BigNumber(await this.web3.eth.getBalance(this.subAccount));
      const topAmount = new BigNumber(await this.auction.highestBidAmount());

      // Bid using larger amount of funds than the current top bidder
      const bidAmount = new BigNumber(await this.auction.highestBidAmount()).plus(new BigNumber('1e10'));
      await this.auction.sendTransaction({
        from: this.mainAccount,
        to: this.auction.address,
        value: bidAmount,
      });

      // Confirm the refund
      assert.equal(new BigNumber(await this.web3.eth.getBalance(this.subAccount)).toFixed(0), preBalance.plus(topAmount).toFixed(0));

      // Confirm the updated top bidding
      assert.equal(new BigNumber(await this.auction.highestBidAmount()).toFixed(0), bidAmount);
      return assert.equal((await this.auction.highestBidder()).toLowerCase(), this.mainAccount);
    });

    it('should not allow users to bid after the auction has ended', async function () {
      // Fast-forward until the auction has ended (> 3 days)
      await time.increase(300000);

      const amount = new BigNumber(await this.auction.highestBidAmount()).plus(new BigNumber('1e10'));

      return assert.isRejected(
        this.auction.sendTransaction({
          from: this.mainAccount,
          to: this.auction.address,
          value: amount,
        })
      );
    });

    it('should allow any account to close the auction and mint the NFT to the winner', async function () {
      const preBalance = new BigNumber(await this.web3.eth.getBalance(this.financeAddress));
      const amount = new BigNumber(await this.auction.highestBidAmount());

      await this.auction.redeemToken();

      // Check the updated balance of the finance address
      assert.equal(preBalance.plus(amount).toFixed(0), new BigNumber(await this.web3.eth.getBalance(this.financeAddress)).toFixed(0));

      // Check if the NFT is successfully minted
      assert.equal(new BigNumber(await this.token.totalSupply()).toFixed(0), new BigNumber(1).toFixed(0));
      return assert.equal((await this.token.ownerOf(1)).toLowerCase(), this.mainAccount);
    });
  });
});
