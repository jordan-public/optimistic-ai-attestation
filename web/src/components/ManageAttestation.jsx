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
            //cOptimisticOracleV3Interface.
            } catch(e) { 
                setDataId(null);
                setAttestationRequestCID(null);
                //setModel(attestationRequest.model);
                setQuestion('');
                setAnswer('');
            }
        }) ();
    }, [assertionId]);

    return (<Box borderWidth='1px' width='100%' p={4} borderRadius='md' shadow='lg' bg='black'>
        <Text>Attestation:</Text>
    </Box>);
}

export default ManageAttestation;