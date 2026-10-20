// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SkillPassRegistryV2
/// @notice Sello público de los SkillPass de TalentPact por lotes diarios.
///         Cada día se publica UNA raíz de Merkle con todas las credenciales
///         selladas ese día (docs/plan_post_reunion/03_blockchain_de_pago.md §4.2).
///         No guarda datos personales: solo raíces de 32 bytes y su fecha. Cada
///         hoja es keccak256(sal ‖ credencial); sin la sal (que se borra al
///         borrar la cuenta) la hoja no se puede vincular a nadie.
///         Las credenciales selladas con el contrato v1 (anchor por hash) siguen
///         verificándose contra aquel contrato.
contract SkillPassRegistryV2 {
    /// @notice Dirección autorizada a publicar lotes (recomendado: una multifirma 2 de 2).
    address public issuer;
    /// @notice Emisor propuesto, pendiente de aceptar (traspaso en dos pasos).
    address public pendingIssuer;

    /// @notice raíz del lote => fecha de publicación (0 si no existe).
    mapping(bytes32 => uint256) public rootAnchoredAt;
    /// @notice raíz del lote => número de credenciales que contiene.
    mapping(bytes32 => uint32) public rootLeaves;

    event RootAnchored(bytes32 indexed root, uint32 leaves, uint256 timestamp);
    event IssuerProposed(address indexed currentIssuer, address indexed proposedIssuer);
    event IssuerTransferred(address indexed previousIssuer, address indexed newIssuer);

    modifier onlyIssuer() {
        require(msg.sender == issuer, "SkillPass: caller is not the issuer");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    /// @notice Publica la raíz del lote del día. Idempotente por raíz.
    function anchorRoot(bytes32 root, uint32 leaves) external onlyIssuer {
        require(root != bytes32(0), "SkillPass: empty root");
        require(leaves > 0, "SkillPass: empty batch");
        require(rootAnchoredAt[root] == 0, "SkillPass: already anchored");
        rootAnchoredAt[root] = block.timestamp;
        rootLeaves[root] = leaves;
        emit RootAnchored(root, leaves, block.timestamp);
    }

    /// @notice Comprueba, sin TalentPact, que una hoja está en un lote publicado.
    ///         Árbol de pares ordenados: en cada nivel se hashea (menor ‖ mayor).
    /// @return included true si la prueba lleva a una raíz publicada.
    /// @return timestamp fecha de publicación de esa raíz (0 si no lo está).
    function verifyLeaf(bytes32 leaf, bytes32[] calldata proof, bytes32 root)
        external
        view
        returns (bool included, uint256 timestamp)
    {
        bytes32 h = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            h = h < p ? keccak256(abi.encodePacked(h, p)) : keccak256(abi.encodePacked(p, h));
        }
        uint256 ts = rootAnchoredAt[root];
        return (h == root && ts != 0, h == root ? ts : 0);
    }

    /// @notice Propone un nuevo emisor; no cambia nada hasta que lo acepte.
    function proposeIssuer(address newIssuer) external onlyIssuer {
        require(newIssuer != address(0), "SkillPass: zero address");
        pendingIssuer = newIssuer;
        emit IssuerProposed(issuer, newIssuer);
    }

    /// @notice El emisor propuesto acepta. Evita perder el control por una dirección mal escrita.
    function acceptIssuer() external {
        require(msg.sender == pendingIssuer, "SkillPass: caller is not the pending issuer");
        emit IssuerTransferred(issuer, pendingIssuer);
        issuer = pendingIssuer;
        pendingIssuer = address(0);
    }
}
