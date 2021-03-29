pragma solidity ^0.5.17;

import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/ownership/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/lifecycle/Pausable.sol";


interface IOwnrLSToken {
  function totalSupply() external view returns (uint256);
  function mintToken(address _account) external returns (bool);
}

contract OwnrLSAuction is Ownable, Pausable {
  using SafeMath for uint256;
  using SafeMath for uint8;

  address payable public financeAddress;                                      // OWNR finance address
  IOwnrLSToken public tokenContract;                                          // OWNR LS token contract interface

  uint256 constant auctionDuration = 3 days;                                  

  uint256 public auctionEndTime;                                              
  bool public tokenClaimed;                                                   

  uint256 public highestBidAmount;                                            
  address payable public highestBidder;                                       

  uint256 public reserveAmount;                                               

  event UserBid(address indexed account, uint256 amount, uint256 timestamp);  // Emitted every time a new bid is successfully received

  constructor (address _tokenAddress, uint256 _reserve) public {
    // Set the finance address to the contract owner address by default
    financeAddress = msg.sender;
    reserveAmount = _reserve;
    tokenContract = IOwnrLSToken(_tokenAddress);
  }


  function setFinanceAddress(address payable _financeAddress) external onlyOwner {
    require(_financeAddress != address(0), "Invalid Address");
    financeAddress = _financeAddress;
  }

  // Handles new bids
  function() external payable whenNotPaused {
    // Only non-contract Ethereum accounts can bid
    require(tx.origin == msg.sender, "Invalid Account");
    // Check if the bid is higher than the current bid and the reserve amount
    require(msg.value > highestBidAmount && msg.value > reserveAmount, "Insufficient Funds");
    // Check if the auction is still running
    require(auctionEndTime == 0 || block.timestamp < auctionEndTime, "Auction Has Ended");

    uint256 previousHighestAmount = highestBidAmount;
    address payable previousHighestBidder = highestBidder;
    highestBidAmount = msg.value;
    highestBidder = msg.sender;

    if (auctionEndTime == 0) {
      // If it's the first bid, begin the auction by setting the end time
      auctionEndTime = block.timestamp + auctionDuration;
    } else {
      // Otherwise, return funds to the previous highest bidder
      previousHighestBidder.transfer(previousHighestAmount);
    }

    emit UserBid(msg.sender, msg.value, block.timestamp);
  }

  // Mints the NFT for the winning bidder after the auction has ended
  function redeemToken() external {
    require(!tokenClaimed, "Token Has Been Claimed");
    require(block.timestamp >= auctionEndTime, "Auction Is Still Running");

    // Send funds to the OWNR finance address
    financeAddress.transfer(highestBidAmount);

    // Set `tokenClaimed` to true to prevent additional NFT-minting
    tokenClaimed = true;

    require(tokenContract.mintToken(highestBidder), "Error Minting Token");
  }
}
