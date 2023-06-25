// SPDX-License-Identifier: BUSL-1.1
import Head from 'next/head'
import React from 'react'
import { Box } from '@chakra-ui/react'

import TitleBar from '@/components/TitleBar'
import Body from '@/components/Body'

export default function Home() {
  const [signer, setSigner] = React.useState(null);
  const [address, setAddress] = React.useState(null);

  return (<>
    <Head>
      <title>AI Attestation Request</title>
      <meta name="description" content="AI Attestation Request" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Box bg='black' w='100%' h='100%' p={4} color='white'>
      <TitleBar setSigner={setSigner} address={address} setAddress={setAddress} />
      <Body signer={signer} address={address} />
    </Box>
  </>)
}
