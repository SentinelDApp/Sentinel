// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SentinelUser {
    // A simple structure to hold user info on blockchain
    struct User {
        address walletAddress;
        string role;
        bool isRegistered;
    }

    // Mapping to store users by their wallet address
    mapping(address => User) public users;

    // Event to notify when a user is added
    event UserRegistered(address indexed wallet, string role);

    // Function to register a user
    function registerUser(string memory _role) public {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = User(msg.sender, _role, true);
        
        emit UserRegistered(msg.sender, _role);
    }

    // Function to check if a user exists
    function isUserRegistered(address _wallet) public view returns (bool) {
        return users[_wallet].isRegistered;
    }
}