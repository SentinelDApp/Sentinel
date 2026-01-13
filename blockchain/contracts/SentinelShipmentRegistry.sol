// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SentinelShipmentRegistry
 * @notice Phase 1 of Sentinel's blockchain-based supply chain platform.
 * 
 * PHILOSOPHY:
 * Sentinel anchors shipment identity on-chain only after supplier confirmation,
 * enabling container-level traceability while preserving immutability.
 * 
 * The blockchain serves as a source of truth for locked shipments,
 * not as a database for operational data. Off-chain systems handle workflow,
 * while on-chain records provide tamper-proof audit trails.
 */
contract SentinelShipmentRegistry {

    // ═══════════════════════════════════════════════════════════════════════
    // ENUMS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Represents the lifecycle status of a shipment.
     * @dev Phase 1 only uses READY_FOR_DISPATCH. Other states are defined
     *      for future phases to maintain enum stability.
     */
    enum ShipmentStatus {
        CREATED,
        READY_FOR_DISPATCH,
        IN_TRANSIT,
        AT_WAREHOUSE,
        DELIVERED
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Immutable shipment record anchored on-chain after supplier confirmation.
     * @param supplier The address that confirmed and locked the shipment
     * @param batchId Identifier for the product batch
     * @param numberOfContainers Number of containers in the shipment
     * @param quantityPerContainer Units per container
     * @param createdAt Timestamp when the shipment was locked on-chain
     * @param status Current lifecycle status of the shipment
     */
    struct Shipment {
        address supplier;
        string batchId;
        uint256 numberOfContainers;
        uint256 quantityPerContainer;
        uint256 createdAt;
        ShipmentStatus status;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Maps shipment hash to its on-chain record
    mapping(string => Shipment) private shipments;

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a shipment is confirmed and locked by the supplier.
     * @param shipmentHash Unique identifier for the shipment
     * @param supplier Address of the supplier who locked this shipment
     * @param batchId Identifier for the product batch
     * @param numberOfContainers Number of containers in the shipment
     * @param quantityPerContainer Units per container
     * @param timestamp Block timestamp when the shipment was locked
     */
    event ShipmentLocked(
        string shipmentHash,
        address indexed supplier,
        string batchId,
        uint256 numberOfContainers,
        uint256 quantityPerContainer,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Confirms and locks a shipment on-chain, making it immutable.
     * @dev This function can only be called once per shipmentHash.
     *      The caller (msg.sender) is recorded as the supplier.
     *      Once locked, the shipment cannot be modified.
     * @param shipmentHash Unique identifier for the shipment (generated off-chain)
     * @param batchId Identifier for the product batch
     * @param numberOfContainers Number of containers in the shipment (must be > 0)
     * @param quantityPerContainer Units per container (must be > 0)
     */
    function confirmAndLockShipment(
        string memory shipmentHash,
        string memory batchId,
        uint256 numberOfContainers,
        uint256 quantityPerContainer
    ) public {
        // Ensure this shipment has not been registered before
        require(
            shipments[shipmentHash].createdAt == 0,
            "Shipment already exists"
        );

        // Validate container count is meaningful
        require(numberOfContainers > 0, "Number of containers must be greater than zero");

        // Validate quantity per container is meaningful
        require(quantityPerContainer > 0, "Quantity per container must be greater than zero");

        // Anchor the shipment on-chain as ready for dispatch
        shipments[shipmentHash] = Shipment({
            supplier: msg.sender,
            batchId: batchId,
            numberOfContainers: numberOfContainers,
            quantityPerContainer: quantityPerContainer,
            createdAt: block.timestamp,
            status: ShipmentStatus.READY_FOR_DISPATCH
        });

        // Emit event for off-chain indexing and audit
        emit ShipmentLocked(
            shipmentHash,
            msg.sender,
            batchId,
            numberOfContainers,
            quantityPerContainer,
            block.timestamp
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // READ FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Checks if a shipment exists on-chain.
     * @param shipmentHash The unique identifier of the shipment
     * @return exists True if the shipment has been locked, false otherwise
     */
    function shipmentExists(string memory shipmentHash) public view returns (bool exists) {
        return shipments[shipmentHash].createdAt != 0;
    }

    /**
     * @notice Checks if a shipment is locked (immutable) and ready for dispatch.
     * @param shipmentHash The unique identifier of the shipment
     * @return locked True if the shipment exists and is ready for dispatch
     */
    function isShipmentLocked(string memory shipmentHash) public view returns (bool locked) {
        if (shipments[shipmentHash].createdAt == 0) {
            return false;
        }
        return shipments[shipmentHash].status == ShipmentStatus.READY_FOR_DISPATCH;
    }

    /**
     * @notice Retrieves the current status of a shipment.
     * @param shipmentHash The unique identifier of the shipment
     * @return status The current lifecycle status of the shipment
     */
    function getShipmentStatus(string memory shipmentHash) public view returns (ShipmentStatus status) {
        require(
            shipments[shipmentHash].createdAt != 0,
            "Shipment does not exist"
        );
        return shipments[shipmentHash].status;
    }

    /**
     * @notice Retrieves complete details of a shipment.
     * @param shipmentHash The unique identifier of the shipment
     * @return supplier The address that locked this shipment
     * @return batchId The product batch identifier
     * @return numberOfContainers The number of containers in the shipment
     * @return quantityPerContainer The units per container
     * @return createdAt The timestamp when the shipment was locked
     * @return status The current lifecycle status
     */
    function getShipment(string memory shipmentHash)
        public
        view
        returns (
            address supplier,
            string memory batchId,
            uint256 numberOfContainers,
            uint256 quantityPerContainer,
            uint256 createdAt,
            ShipmentStatus status
        )
    {
        require(
            shipments[shipmentHash].createdAt != 0,
            "Shipment does not exist"
        );

        Shipment storage shipment = shipments[shipmentHash];

        return (
            shipment.supplier,
            shipment.batchId,
            shipment.numberOfContainers,
            shipment.quantityPerContainer,
            shipment.createdAt,
            shipment.status
        );
    }
}
