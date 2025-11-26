// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CredentialRegistry is Ownable {
    struct CredentialInfo {
        address issuer;
        uint256 issuanceDate;
        string metadataReference;
    }

    mapping(bytes32 => CredentialInfo) private credentials;

    event CredentialIssued(
        bytes32 indexed credentialHash,
        address indexed issuer,
        string metadataReference
    );

    constructor() Ownable(msg.sender) {}

    function issueCredential(bytes32 credentialHash, string calldata metadataReference)
        external
        onlyOwner
    {
        require(credentials[credentialHash].issuer == address(0), "Credential already issued");

        credentials[credentialHash] = CredentialInfo({
            issuer: msg.sender,
            issuanceDate: block.timestamp,
            metadataReference: metadataReference
        });

        emit CredentialIssued(credentialHash, msg.sender, metadataReference);
    }

    function getCredential(bytes32 credentialHash)
        external
        view
        returns (address, uint256, string memory)
    {
        CredentialInfo storage info = credentials[credentialHash];
        require(info.issuer != address(0), "Credential not found");
        return (info.issuer, info.issuanceDate, info.metadataReference);
    }
}
