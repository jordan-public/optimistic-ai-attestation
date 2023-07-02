// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Heading, Select, Textarea, Text, VStack, HStack, Input, Button, Box } from '@chakra-ui/react';
import { ethers } from 'ethers';
import  { CID } from 'multiformats';
import  { decode } from 'multiformats/hashes/digest';
import OnChainContext from './OnChainContext';
import { getFile, addFile, uint8ArrayToHexString, hexStringToUint8Array } from './Utils'

function ManageAttestation({ assertionId, setDataId, setAttestationRequestCID, setModel, setQuestion, setAnswer }) {
    const onChainInfo = React.useContext(OnChainContext);

    React.useEffect(() => {
        (async () => {
            const dataAsserted = await onChainInfo.cAIAttestationAsserter.assertionsData(assertionId);
            setDataId(dataAsserted.dataId);
console.log('dataAsserted', dataAsserted)
console.log('dataAsserted.dataId', dataAsserted.dataId)
            //cOptimisticOracleV3Interface.
        }) ();
    }, [assertionId]);

    return (<Box borderWidth='1px' width='100%' p={4} borderRadius='md' shadow='lg' bg='black'>
        <Text>Attestation:</Text>
    </Box>);
}

export default ManageAttestation;