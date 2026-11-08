// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProvenanceLedger
 * @dev Records cryptographic hashes of FEW nexus scenario runs on-chain.
 *      Provides immutable audit trail for transparency and reproducibility.
 *      Only stores hashes — never raw data.
 */
contract ProvenanceLedger {

    struct ProvenanceRecord {
        uint256 id;
        string scenarioId;          // UUID from Supabase
        string inputHash;           // SHA-256 of input parameters
        string outputHash;          // SHA-256 of model outputs
        string parametersHash;      // SHA-256 of full parameters JSON
        string modelVersionHash;    // SHA-256 of model version string
        string combinedHash;        // SHA-256 of all hashes concatenated
        address recorder;           // Wallet that submitted
        uint256 timestamp;          // Block timestamp
        bool verified;              // Verification flag
    }

    mapping(uint256 => ProvenanceRecord) public records;
    mapping(string => uint256[]) public scenarioRecords; // scenarioId => record IDs
    uint256 public recordCount;

    address public owner;
    mapping(address => bool) public authorizedRecorders;

    event RecordCreated(
        uint256 indexed recordId,
        string scenarioId,
        string combinedHash,
        address indexed recorder,
        uint256 timestamp
    );

    event RecordVerified(uint256 indexed recordId, address verifier);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: owner only");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedRecorders[msg.sender] || msg.sender == owner,
            "Not authorized recorder"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedRecorders[msg.sender] = true;
    }

    function addAuthorizedRecorder(address recorder) external onlyOwner {
        authorizedRecorders[recorder] = true;
    }

    function removeAuthorizedRecorder(address recorder) external onlyOwner {
        authorizedRecorders[recorder] = false;
    }

    /**
     * @dev Record a new scenario run provenance entry.
     */
    function recordProvenance(
        string memory scenarioId,
        string memory inputHash,
        string memory outputHash,
        string memory parametersHash,
        string memory modelVersionHash,
        string memory combinedHash
    ) external onlyAuthorized returns (uint256) {
        require(bytes(scenarioId).length > 0, "scenarioId required");
        require(bytes(combinedHash).length == 64, "Invalid SHA-256 hash length");

        recordCount++;
        uint256 newId = recordCount;

        // Assign fields one at a time (instead of a struct literal) to stay
        // within the EVM's 16-slot stack limit ("Stack too deep").
        ProvenanceRecord storage r = records[newId];
        r.id = newId;
        r.scenarioId = scenarioId;
        r.inputHash = inputHash;
        r.outputHash = outputHash;
        r.parametersHash = parametersHash;
        r.modelVersionHash = modelVersionHash;
        r.combinedHash = combinedHash;
        r.recorder = msg.sender;
        r.timestamp = block.timestamp;

        scenarioRecords[scenarioId].push(newId);

        emit RecordCreated(newId, scenarioId, combinedHash, msg.sender, block.timestamp);

        return newId;
    }

    /**
     * @dev Verify a record by ID (marks it as independently verified).
     */
    function verifyRecord(uint256 recordId) external {
        require(records[recordId].id != 0, "Record does not exist");
        records[recordId].verified = true;
        emit RecordVerified(recordId, msg.sender);
    }

    /**
     * @dev Get all record IDs for a given scenario UUID.
     */
    function getScenarioRecordIds(string calldata scenarioId)
        external view returns (uint256[] memory) {
        return scenarioRecords[scenarioId];
    }

    /**
     * @dev Get a full record by ID.
     */
    function getRecord(uint256 recordId)
        external view returns (ProvenanceRecord memory) {
        require(records[recordId].id != 0, "Record does not exist");
        return records[recordId];
    }

    /**
     * @dev Validate a combined hash against an on-chain record.
     *      Returns true if the provided hash matches the stored one.
     */
    function validateHash(uint256 recordId, string calldata hashToVerify)
        external view returns (bool) {
        require(records[recordId].id != 0, "Record does not exist");
        return keccak256(bytes(records[recordId].combinedHash)) ==
               keccak256(bytes(hashToVerify));
    }
}
