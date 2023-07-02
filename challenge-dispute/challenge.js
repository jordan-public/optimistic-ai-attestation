import { create } from 'ipfs-http-client';
import  { CID } from 'multiformats';
import  { decode } from 'multiformats/hashes/digest';
import axios from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
//import aAIAttestationAsserter from '../web/src/artifacts/AIAttestationAsserter.sol/AIAttestationAsserter.json';
// import { getFile, addFile, uint8ArrayToHexString, hexStringToUint8Array, bytes32StringToCID, cidToBytes32String } from '../web/src/components/Utils.js'
// import pkg from '../web/src/components/Utils.js';
// const { getFile, addFile, uint8ArrayToHexString, hexStringToUint8Array, bytes32StringToCID, cidToBytes32String } = pkg;

async function getFile(cid, ipfs) {
  const stream = ipfs.cat(cid);
  let data = "";

  for await (const chunk of stream) {
    data += new TextDecoder().decode(chunk);
  }

  return data;
}

export function hexStringToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
      console.log("Invalid hexadecimal string passed to conversion function.");
      return new Uint8Array();
  }

  var bytes = new Uint8Array(Math.floor(hexString.length / 2));

  for (let i = 0; i < hexString.length; i+=2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return bytes;
}

export function bytes32StringToCID(bytes32) {
  let multihashVerify = new Uint8Array(34);
  multihashVerify.set([0x12, 0x20]);
  multihashVerify.set(hexStringToUint8Array(bytes32.slice(2)), 2);
  return CID.createV0(decode(multihashVerify)).toString();
}

const main = async () => {
  try {
    dotenv.config({ path: '../.env' });
    const apiKey = process.env.OPENAI_API_KEY;
    const chainId = process.env.CHAIN_ID;
    const rpc = process.env.RPC;

    const assertionId = process.argv[2];

    const ipfs = create({ host: '127.0.0.1', port: 5001, protocol: 'http' });
    const aAIAttestationAsserter = JSON.parse(fs.readFileSync('../web/src/artifacts/AIAttestationAsserter.sol/AIAttestationAsserter.json', 'utf8')).abi;
    const contractAddress = JSON.parse(fs.readFileSync('../broadcast/AIAttestationAsserter.s.sol/'+chainId+'/run-latest.json', 'utf8')).transactions[0].contractAddress;
    const provider = new ethers.JsonRpcProvider(rpc);
    const cAIAttestationAsserter = new ethers.Contract(contractAddress, aAIAttestationAsserter, provider);
    const dataAsserted = await cAIAttestationAsserter.assertionsData(assertionId);
    const cid = bytes32StringToCID(dataAsserted.dataId);
    const attestationRequest = JSON.parse(await getFile(cid, ipfs));
    
    const verificationQuestion = "Here is a question that you were asked and your answer. Provide a brief explanation. Then respond with only a number from 0 to 1 and nothing else about the likelihood that this answer was actually produced by you:\n";
    const toVerify = "Question:\n" + attestationRequest.question + "\nAnswer\n" + attestationRequest.answer;

    const data = {
        model: attestationRequest.model,
        messages: [{ role: "user", content: verificationQuestion + toVerify }],
        temperature: 0.0,
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        }
    });
    const answer = response.data.choices[0].message.content;
    console.log("Model:" + attestationRequest.model);
    console.log("Question:" + attestationRequest.question);
    console.log("Answer:" + attestationRequest.answer);
    console.log(answer);
  } catch(e) {
    console.log(e);
  }
}

main();
