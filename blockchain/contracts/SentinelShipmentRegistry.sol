// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SentinelShipmentRegistry
 * @notice Phase 1 of Sentinel's blockchain-based supply chain platform.
 * 
 * PHILOSOPHY:
 * This contract anchors shipment identity on-chain only when a shipment is
 * physically ready for dispatch, ensuring immutability without storing drafts.
 * 
 * The blockchain serves as a source of truth for shipment lifecycle events,
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
     * @notice Immutable shipment record anchored on-chain.
     * @param supplier The address that marked the shipment ready for dispatch
     * @param batchId Identifier for the product batch
     * @param quantity Number of units in the shipment
     * @param createdAt Timestamp when the shipment was anchored on-chain
     * @param status Current lifecycle status of the shipment
     */
    struct Shipment {
        address supplier;
        string batchId;
        uint256 quantity;
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
     * @notice Emitted when a shipment is marked ready for dispatch.
     * @param shipmentHash Unique identifier for the shipment
     * @param supplier Address of the supplier who created this record
     * @param batchId Identifier for the product batch
     * @param quantity Number of units in the shipment
     * @param timestamp Block timestamp when the shipment was anchored
     */
    event ShipmentReadyForDispatch(
        string shipmentHash,
        address indexed supplier,
        string batchId,
        uint256 quantity,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════
    // WRITE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Anchors a shipment on-chain when it is physically ready for dispatch.
     * @dev This function can only be called once per shipmentHash.
     *      The caller (msg.sender) is recorded as the supplier.
     * @param shipmentHash Unique identifier for the shipment (generated off-chain)
     * @param batchId Identifier for the product batch
     * @param quantity Number of units in the shipment (must be > 0)
     */
    function markReadyForDispatch(
        string memory shipmentHash,
        string memory batchId,
        uint256 quantity
    ) public {
        // Ensure this shipment has not been registered before
        require(
            shipments[shipmentHash].createdAt == 0,
            "Shipment already exists"
        );

        // Validate quantity is meaningful
        require(quantity > 0, "Quantity must be greater than zero");

        // Anchor the shipment on-chain
        shipments[shipmentHash] = Shipment({
            supplier: msg.sender,
            batchId: batchId,
            quantity: quantity,
            createdAt: block.timestamp,
            status: ShipmentStatus.READY_FOR_DISPATCH
        });

        // Emit event for off-chain indexing and audit
        emit ShipmentReadyForDispatch(
            shipmentHash,
            msg.sender,
            batchId,
            quantity,
            block.timestamp
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // READ FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Checks if a shipment exists on-chain.
     * @param shipmentHash The unique identifier of the shipment
     * @return exists True if the shipment has been anchored, false otherwise
     */
    function shipmentExists(string memory shipmentHash) public view returns (bool exists) {
        return shipments[shipmentHash].createdAt != 0;
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
     * @return supplier The address that anchored this shipment
     * @return batchId The product batch identifier
     * @return quantity The number of units in the shipment
     * @return createdAt The timestamp when the shipment was anchored
     * @return status The current lifecycle status
     */
    function getShipment(string memory shipmentHash)
        public
        view
        returns (
            address supplier,
            string memory batchId,
            uint256 quantity,
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
            shipment.quantity,
            shipment.createdAt,
            shipment.status
        );
    }
}
