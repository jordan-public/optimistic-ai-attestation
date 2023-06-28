// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Textarea, Text, VStack, HStack, Input, Button, Box } from '@chakra-ui/react'
import OnChainContext from './OnChainContext'
import { ethers } from 'ethers'
import aAIAttestationAsserter from '../artifacts/AIAttestationAsserter.sol/AIAttestationAsserter.json'
import * as IPFS from 'ipfs-http-client';
import StressTestAttestation from './StressTestAttestation'

function Body({ signer, address }) {
    const [onChainInfo, setOnChainInfo] = React.useState({});
    const [apiKey, setApiKey] = React.useState(null);
    const [question, setQuestion] = React.useState(null);
    const [answer, setAnswer] = React.useState(null);
    const [attestationRequestCID, setAttestationRequestCID] = React.useState(null);
    const [assertionId, setAssertionId] = React.useState(null);

    async function addFile(content) {
        const { path } = await onChainInfo.ipfs.add(content);
        await onChainInfo.ipfs.pin.add(path);
        return path;
    }
    
    async function getFile(cid) {
        const stream = onChainInfo.ipfs.cat(cid);
        let data = "";
    
        for await (const chunk of stream) {
          data += new TextDecoder().decode(chunk);
        }
    
        return data;
    }

    React.useEffect(() => {
        if (!signer) return;
        (async () => {
            const ipfs = await IPFS.create("http://localhost:5001")
            const cAIAttestationAsserter = new ethers.Contract("0x27c26188E418616172CBe860541029BfE728A1bA", aAIAttestationAsserter.abi, signer);
            setOnChainInfo({signer: signer, address: address, ipfs: ipfs, cAIAttestationAsserter: cAIAttestationAsserter });
        }) ();
    }, [signer, address]);


    const onQuery = async () => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.openai.com/v1/chat/completions");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + apiKey);

        const data = JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }],
          temperature: 0.0,
        });

        xhr.send(data);

        xhr.onload = function () {
          console.log("xhr", xhr);
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
console.log("response", response);
            const a = response.choices[0].message.content;
            setAnswer(a)

            const attestationRequest = {question: question, answer: a };

            addFile(JSON.stringify(attestationRequest))
              .then((cid) => {
                    console.log("CID: ", cid);
                    setAttestationRequestCID(cid);
                
                    getFile(cid)
                    .then((r) => console.log("Verification: ", JSON.parse(r)))
                    .catch(console.error);
                })
              .catch(console.error);
          } else {
            console.log("Error: " + xhr.status);
          }
        };
    }

    const onAttest = async () => {
        try{
            const dataId = ethers.encodeBytes32String(attestationRequestCID.slice(0,31));
            const data = ethers.encodeBytes32String(attestationRequestCID.slice(31));

console.log("dataid", dataId)
console.log("data", data)

            const tx = await onChainInfo.cAIAttestationAsserter.assertDataFor(dataId, data, address, { gasLimit: ethers.parseUnits('10000000', 'wei') });
            const r = await tx.wait()
            // This emits DataAsserted(dataId, data, asserter, assertionId)
            window.alert('Completed. Block hash: ' + r.blockHash);
        } catch(e) {
            window.alert(e.message + "\n" + (e.data?e.data.message:""))
        }

    }

    React.useEffect(() => {
        if (!onChainInfo.cAIAttestationAsserter) return;
        // Listening for DataAsserted event
        const event = onChainInfo.cAIAttestationAsserter.filters.DataAsserted(); // Define event filter
        const listener = onChainInfo.cAIAttestationAsserter.on(event, async (dataId, data, asserter, _assertionId, e) => {
            setAssertionId(_assertionId);
        });

        // Clean up the effect
        return () => {
            onChainInfo.cAIAttestationAsserter.off(event, listener);
        };
    }, [onChainInfo.cAIAttestationAsserter]);

    if (!signer) return(<><br/>Please connect!</>)
    if (!onChainInfo.cAIAttestationAsserter) return("Please wait...")
    return (<OnChainContext.Provider value={onChainInfo} >
        <VStack width='100%' p={4} align='center' borderRadius='md' shadow='lg' bg='gray.700'>
            <HStack justify='left' width='100%'>
                <Text>API Key: </Text>
                <Input type="password" width='30%' onChange={e => setApiKey(e.target.value)}></Input>
            </HStack>
            <Text jutify='left' width='100%'>Question: </Text>
            <Textarea size='lg' onChange={e => setQuestion(e.target.value)}></Textarea>
            <Button color='black' bg='red' size='lg' onClick={onQuery}>Query GPT-3.5-Turbo</Button>
            <Text jutify='left' width='100%'>Answer: </Text>
            <Box borderWidth='1px' p={4} borderRadius='md' shadow='lg' bg='gray.700'>{answer}</Box>
            <StressTestAttestation question={question} answer={answer} apiKey={apiKey} />
            <Box p={4} borderRadius='md' shadow='lg' bg='gray.700'>{attestationRequestCID}</Box>
            <Box p={4} borderRadius='md' shadow='lg' bg='gray.700'>{assertionId && assertionId.toString()}</Box>
            <Button color='black' bg='red' size='lg' onClick={onAttest}>Request Attestation</Button>
        </VStack>
    </OnChainContext.Provider>);
}

export default Body;