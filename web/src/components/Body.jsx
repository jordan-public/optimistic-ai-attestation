// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Heading, Select, Textarea, Text, VStack, HStack, Input, Button, Box } from '@chakra-ui/react'
import OnChainContext from './OnChainContext'
import { ethers } from 'ethers'
import aAIAttestationAsserter from '../artifacts/AIAttestationAsserter.sol/AIAttestationAsserter.json'
import * as IPFS from 'ipfs-http-client';
import StressTestAttestation from './StressTestAttestation'
import  { CID } from 'multiformats';
import  { decode } from 'multiformats/hashes/digest';

function toHexString(byteArray) {
    return Array.from(byteArray, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

function Body({ signer, address }) {
    const [onChainInfo, setOnChainInfo] = React.useState({});
    const [apiKey, setApiKey] = React.useState('');
    const [model, setModel] = React.useState('gpt-3.5-turbo');
    const [question, setQuestion] = React.useState('');
    const [answer, setAnswer] = React.useState('');
    const [attestationRequestCID, setAttestationRequestCID] = React.useState(null);
    const [assertionId, setAssertionId] = React.useState(null);
    const [dataId, setDataId] = React.useState(null)

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
            let contractAddress = 0;
            switch ((await signer.provider.getNetwork()).chainId) {
                case 5n: contractAddress = "0x5277e186c1995375132bb559f3E3F94f450bC669"; // Görli
                break;
                case 80001n: contractAddress = "0x27c26188E418616172CBe860541029BfE728A1bA"; // Mumbai
                break;
                case 100n: contractAddress = "0x5277e186c1995375132bb559f3E3F94f450bC669"; // Gnosis
                break;
            }
console.log('AI Attestation Asserter contract address:', contractAddress)
            const cAIAttestationAsserter = new ethers.Contract(contractAddress, aAIAttestationAsserter.abi, signer);
            setOnChainInfo({signer: signer, address: address, ipfs: ipfs, cAIAttestationAsserter: cAIAttestationAsserter });
        }) ();
    }, [signer, address]);

    React.useEffect(() => {
        // Retrieve the stored value from local storage
        const storedValue = localStorage.getItem('apiKey');
        if (storedValue) {
            setApiKey(storedValue);
        }
    }, []);
    
    React.useEffect(() => {
        // Store the value in local storage when the component unmounts
        return () => localStorage.setItem('apiKey', apiKey);
    }, [apiKey]);

    const onQuery = async () => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.openai.com/v1/chat/completions");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + apiKey);

        const data = JSON.stringify({
          model: model,
          messages: [{ role: "user", content: question }],
          temperature: 0.0,
        });

        xhr.send(data);

        xhr.onload = function () {
          console.log("xhr", xhr);
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const a = response.choices[0].message.content;
            setAnswer(a)

            const attestationRequest = { question: question, answer: a, model: model };

            addFile(JSON.stringify(attestationRequest))
            .then((cid) => {
                console.log("CID: ", cid);
                setAttestationRequestCID(cid);
                const _dataId = CID.parse(cid).bytes.slice(2);
                setDataId(_dataId);

                // For debugging only - Convert a bytes32 back to a CID and compare
                let multihashVerify = new Uint8Array(34);
                multihashVerify.set([0x12, 0x20]);
                multihashVerify.set(_dataId, 2);
                const cidVerify = CID.createV0(decode(multihashVerify)).toString();
                if (cid !== cidVerify) {
                    console.error("CID encoding mismatch:", cid, cidVerify);
                    throw new Error("CID encoding mismatch: " + cid + " vs " + cidVerify);
                }
            
                // For debugging only
                getFile(cid)
                .then((r) => console.log("Verification: ", JSON.parse(r)))
                .catch(console.error);
            })
            .catch(e => {
                clearAssertion();    
                window.alert(e.toString());
            });
          } else {
            clearAssertion();
            window.alert("Error: " + JSON.parse(xhr.response)?.error?.message);
          }
        };
    }

    const onAttest = async () => {
        if (null === dataId) {
            window.alert('No Attestation. Enter a question and click Query.');
            return;
        }
        try{
            const trueValue = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const _assertionId = await onChainInfo.cAIAttestationAsserter.assertDataFor.staticCall(dataId, trueValue/*true data*/, address, { gasLimit: ethers.parseUnits('10000000', 'wei') });
console.log('Assertion ID set from static call:', _assertionId)
            // !!! Warning: there could be another call between the above and the next line. This is just a workaround for testnet RPCs not (timely) delivering EVM events
            const tx = await onChainInfo.cAIAttestationAsserter.assertDataFor(dataId, trueValue/*true data*/, address, { gasLimit: ethers.parseUnits('10000000', 'wei') });
            const r = await tx.wait()
            // This emits DataAsserted(dataId, data, asserter, assertionId)
            setAssertionId(_assertionId);
            window.alert('Completed. Block hash: ' + r.blockHash);
        } catch(e) {
            window.alert(e.message + "\n" + (e.data?e.data.message:""))
        }

    }

    React.useEffect(() => {
        if (!onChainInfo.cAIAttestationAsserter || dataId === null) return;
        // Listening for DataAsserted event

        const filter = onChainInfo.cAIAttestationAsserter.filters.DataAsserted(dataId, null, null, null);
    
        const listener = (e) => {
if (e.args.dataId.slice(2) !== toHexString(dataId)) console.error('Data ID mismatch from event. Data ID:', toHexString(dataId), 'vs event Data ID:', e.args.dataId.slice(2));
            setAssertionId(e.args.assertionId);
console.log('Assertion ID set from event:', e.args.assertionId);
        }
       
        onChainInfo.cAIAttestationAsserter.on(filter, listener);

        // Clean up the effect
        return () => {
            onChainInfo.cAIAttestationAsserter.off(filter, listener);
        };
    }, [onChainInfo.cAIAttestationAsserter, dataId]);

    const clearAssertion = () => {
        setDataId(null);
        setAssertionId(null);
        setAttestationRequestCID(null);
        setAnswer('');
    }

    if (!signer) return(<><br/>Please connect!</>)
    if (!onChainInfo.cAIAttestationAsserter) return("Please wait...")
    return (<OnChainContext.Provider value={onChainInfo} >
        <VStack width='100%' p={4} align='center' borderRadius='md' shadow='lg' bg='black'>
            <Heading as="h3" size="md">AI Attestation Request</Heading>
            <HStack justify='left' width='100%'>
                <Box width='50%'>
                    <Text>API Key: </Text>
                    <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}></Input>
                </Box>
                <Box width='50%'>
                    <Text>AI Model:</Text>
                    <Select defaultValue='gpt-3.5-turbo' onChange={event => { setModel(event.target.value); clearAssertion() }}>
                        <option value='gpt-4'>GPT-4</option>
                        <option value='gpt-4-0613'>GPT-4 0613</option>
                        <option value='gpt-4-32k'>GPT-4 32k</option>
                        <option value='gpt-4-32k-0613'>GPT-4 32k 0613</option>
                        <option value='gpt-3.5-turbo'>GPT-3.5 Turbo</option>
                        <option value='gpt-3.5-turbo-0613'>GPT-3.5 Turbo 0613</option>
                        <option value='gpt-3.5-turbo-16k'>GPT-3.5 Turbo 16k</option>
                        <option value='gpt-3.5-turbo-16k-0613'>GPT-3.5 Turbo 16k 0613</option>
                    </Select>
                </Box>
            </HStack>
            <Text justify='left' width='100%'>Question: </Text>
            <Textarea size='lg' value={question} onChange={e => { setQuestion(e.target.value); clearAssertion() }}></Textarea>
            <Button color='black' bg='red' size='lg' onClick={onQuery}>Query</Button>
            <Text justify='left' width='100%'>Answer: </Text>
            <Box borderWidth='1px' width='100%' p={4} borderRadius='md' shadow='lg' bg='black'>{answer}</Box>
            <StressTestAttestation question={question} answer={answer} model={model} apiKey={apiKey} />
            <Box p={4} borderRadius='md' shadow='lg' bg='black'>Q&A CID: {attestationRequestCID ? attestationRequestCID : 'N/A'}</Box>
            <Box p={4} borderRadius='md' shadow='lg' bg='black'>Data ID: {dataId ? toHexString(dataId) : 'N/A'}</Box>
            <Button color='black' bg='red' size='lg' onClick={onAttest}>Request Attestation</Button>
            <Box p={4} borderRadius='md' shadow='lg' bg='black'>Attestation ID: {assertionId ? assertionId.toString() : 'N/A'}</Box>
        </VStack>
    </OnChainContext.Provider>);
}

export default Body;