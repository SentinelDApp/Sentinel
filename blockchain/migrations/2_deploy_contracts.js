const SentinelUser = artifacts.require("SentinelUser");

module.exports = function (deployer) {
  deployer.deploy(SentinelUser);
};