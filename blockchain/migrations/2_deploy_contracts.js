const SentinelShipmentRegistry = artifacts.require("SentinelShipmentRegistry");

module.exports = function (deployer) {
  deployer.deploy(SentinelShipmentRegistry);
};