// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DocumentVerification {
    // Maps a document hash to whether it's registered
    mapping(bytes32 => bool) private registeredHashes;

    // Maps a document hash to the address that registered it (the issuer)
    mapping(bytes32 => address) private hashIssuer;

    // Maps a document hash to when it was registered
    mapping(bytes32 => uint256) private hashTimestamp;

    // Only these addresses are allowed to register documents (authorized issuers)
    mapping(address => bool) public authorizedIssuers;

    address public admin;

    event DocumentRegistered(bytes32 indexed docHash, address indexed issuer, uint256 timestamp);
    event IssuerAuthorized(address indexed issuer);

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true; // deployer is authorized by default
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    // Admin can authorize new issuers (e.g. government departments)
    function authorizeIssuer(address issuer) external onlyAdmin {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    // Issuer registers a document's hash on the blockchain
    function registerDocument(bytes32 docHash) external onlyAuthorizedIssuer {
        require(!registeredHashes[docHash], "Document already registered");
        registeredHashes[docHash] = true;
        hashIssuer[docHash] = msg.sender;
        hashTimestamp[docHash] = block.timestamp;
        emit DocumentRegistered(docHash, msg.sender, block.timestamp);
    }

    // Anyone can verify if a document hash is genuine
    function verifyDocument(bytes32 docHash) external view returns (bool isValid, address issuer, uint256 timestamp) {
        isValid = registeredHashes[docHash];
        issuer = hashIssuer[docHash];
        timestamp = hashTimestamp[docHash];
    }
}