pragma solidity ^0.5.17;

import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/ownership/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721Full.sol";


contract OwnrLSToken is ERC721Full, ERC721Pausable, Ownable {
  using SafeMath for uint256;
  using SafeMath for uint32;

  address public auctionContractAddress;                      // Address of the auction "logic" contract

  string constant fileHash = "9acd4d775f68bcd853cbed99ab7199b898fede803a155ae5e02b424df3ad49fe";   // Sha256 hash of the file backing the NFT
  string constant fileURL = "https://ipfs.io/ipfs/QmceQgBGXVkprAQ39bp3mu21jbwnZD4iZUMKApR8XNoQZx?filename=lance_stephenson_nft.468ce29d.gif";                                      

  constructor (string memory _name, string memory _symbol) public ERC721Full(_name, _symbol) {}

  // Modifier that restricts function calls to the auction contract
  modifier onlyAuction() {
    require(msg.sender == auctionContractAddress, "Unauthorized Access");
    _;
  }

  function setAuctionContract(address _newAuctionAddress) external onlyOwner {
    require(_newAuctionAddress != address(0), "Invalid Address");
    auctionContractAddress = _newAuctionAddress;
  }

  function mintToken(address _account) external onlyAuction whenNotPaused returns (bool) {
    require(_account != address(0), "Invalid Address");

    uint256 tokenIndex = totalSupply() + 1;
    super._mint(_account, tokenIndex);

    return true;
  }
}
