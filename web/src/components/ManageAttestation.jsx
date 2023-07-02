// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Heading, Select, Textarea, Text, VStack, HStack, Input, Button, Box } from '@chakra-ui/react';
import { ethers } from 'ethers';
import  { CID } from 'multiformats';
import  { decode } from 'multiformats/hashes/digest';
import OnChainContext from './OnChainContext';
import { getFile, addFile, uint8ArrayToHexString, hexStringToUint8Array, bytes32StringToCID, cidToBytes32String } from './Utils'

function ManageAttestation({ assertionId, setDataId, setAttestationRequestCID, setModel, setQuestion, setAnswer }) {
    const onChainInfo = React.useContext(OnChainContext);
    const [assertion, setAssertion] = React.useState(null);
    const [currency, setCurrency] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            try {
                const dataAsserted = await onChainInfo.cAIAttestationAsserter.assertionsData(assertionId);
                setDataId(dataAsserted.dataId);
                const cid = bytes32StringToCID(dataAsserted.dataId);
                setAttestationRequestCID(cid);
                const attestationRequest = JSON.parse(await getFile(cid, onChainInfo.ipfs));
                setModel(attestationRequest.model);
                setQuestion(attestationRequest.question);
                setAnswer(attestationRequest.answer);
                const _assertion = await onChainInfo.cOptimisticOracleV3Interface.getAssertion(assertionId);
                setAssertion(_assertion);
            } catch(e) { 
                setDataId(null);
                setAttestationRequestCID(null);
                //setModel(attestationRequest.model);
                setQuestion('');
                setAnswer('');
                setAssertion(null);
            }
        }) ();
    }, [assertionId]);

    React.useEffect(() => {
        if (!assertion || !assertion.currency) return;
        (async () => {
            const abi = [{
                "inputs": [],
                "stateMutability": "view",
                "type": "function",
                "name": "symbol",
                "outputs": [
                  {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                  }
                ]
              }];
            const cCurrency = new ethers.Contract(assertion.currency, abi, onChainInfo.signer);
            setCurrency(await cCurrency.symbol());
        }) ();
    }, [assertion]);

    const onSettle = async () => {
        if (!assertion) return;
        try{
            const tx = await onChainInfo.cOptimisticOracleV3Interface.settleAssertion(assertionId);
            const r = await tx.wait()
            window.alert('Completed. Block hash: ' + r.blockHash);
        } catch(e) {
            window.alert(e.message + "\n" + (e.data?e.data.message:""))
        }
    }

    if (!assertion) return;
    return (<Box borderWidth='1px' width='100%' p={4} borderRadius='md' shadow='lg' bg='black'>
        <Text>Attestation:</Text>
        <br/>
        <Text>Asserter: {assertion.asserter}</Text>
        <br/>
        <Text>Assertion Time: {(new Date(Number(assertion.assertionTime) * 1000)).toString()}</Text>
        <br/>
        <Text>Settled: {assertion.settled ? 'True' : 'False'}</Text>
        <br/>
        <Text>Currency: {currency} ({assertion.currency})</Text>
        <br/>
        <Text>Expiration Time: {(new Date(Number(assertion.expirationTime) * 1000)).toString()}</Text>
        <br/>
        <Text>Settlement Resolution: {assertion.settlementResolution ? 'True' : 'False'}</Text>
        <br/>
        <Text>Domain Id: {assertion.domainId}</Text>
        <br/>
        <Text>Identifier: {assertion.identifier}</Text>
        <br/>
        <Text>Bond: {assertion.bond.toString()}</Text>
        <br/>
        <Text>Callback Recipient: {assertion.callbackRecipient}</Text>
        <br/>
        <Text>Disputer: {assertion.disputer}</Text>
        <br/>
        <Button  color='black' bg='red' size='lg' onClick={onSettle}>Settle</Button>
     </Box>);
}

export default ManageAttestation;