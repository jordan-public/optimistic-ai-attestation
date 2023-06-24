// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
//import "forge-std/Console.sol";
import "../src/AIAttestationAsserter.sol";

contract Deploy is Script {
    function run() public {
        uint256 privateKey = vm.deriveKey(vm.envString("MNEMONIC"), 0);
        vm.startBroadcast(privateKey);
        console.log("Broadcasting from: ", vm.addr(privateKey));
//        /*Görli - WETH*/AIAttestationAsserter c = new AIAttestationAsserter(0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6, 0x9923D42eF695B5dd9911D05Ac944d4cAca3c4EAB);
        /*Mumbai - USDC*/AIAttestationAsserter c = new AIAttestationAsserter(0x0FA8781a83E46826621b3BC094Ea2A0212e71B23, 0x263351499f82C107e540B01F0Ca959843e22464a);
//        /*Gnosis - USDC*/AIAttestationAsserter c = new AIAttestationAsserter(0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83, 0x22A9AaAC9c3184f68C7B7C95b1300C4B1D2fB95C);

        console.log("Counter deployed at: ", address(c));
        vm.stopBroadcast();
    }
}
