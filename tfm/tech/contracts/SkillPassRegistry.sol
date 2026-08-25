// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SkillPassRegistry
/// @notice Ancla huellas (hashes) de credenciales de habilidades TalentPact.
///         NO almacena datos personales: solo el hash del CV verificable y su fecha.
///         El dato real vive off-chain (Supabase), reconciliando inmutabilidad y RGPD.
contract SkillPassRegistry {
    /// @notice Dirección autorizada a anclar credenciales (el emisor, TalentPact).
    address public issuer;

    /// @notice hash del CV => timestamp de anclaje (0 si no está anclado).
    mapping(bytes32 => uint256) public anchoredAt;

    event CredentialAnchored(bytes32 indexed cvHash, uint256 timestamp);
    event IssuerTransferred(address indexed previousIssuer, address indexed newIssuer);

    modifier onlyIssuer() {
        require(msg.sender == issuer, "SkillPass: caller is not the issuer");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    /// @notice Ancla la huella de una credencial. Idempotente por hash.
    /// @param cvHash keccak256 del JSON del SkillPass CV.
    function anchor(bytes32 cvHash) external onlyIssuer {
        require(cvHash != bytes32(0), "SkillPass: empty hash");
        require(anchoredAt[cvHash] == 0, "SkillPass: already anchored");
        anchoredAt[cvHash] = block.timestamp;
        emit CredentialAnchored(cvHash, block.timestamp);
    }

    /// @notice Comprueba si una credencial está anclada y desde cuándo.
    /// @return exists true si el hash está anclado.
    /// @return timestamp fecha de anclaje (0 si no existe).
    function isAnchored(bytes32 cvHash) external view returns (bool exists, uint256 timestamp) {
        uint256 ts = anchoredAt[cvHash];
        return (ts != 0, ts);
    }

    /// @notice Transfiere la capacidad de emisión a otra dirección.
    function transferIssuer(address newIssuer) external onlyIssuer {
        require(newIssuer != address(0), "SkillPass: zero address");
        emit IssuerTransferred(issuer, newIssuer);
        issuer = newIssuer;
    }
}
