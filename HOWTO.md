## Deployment addresses of AIAttestationAsserter:

Görli / WETH Bonds: 0x5277e186c1995375132bb559f3E3F94f450bC669

Gnosis - WETH Bonds: 0x5277e186c1995375132bb559f3E3F94f450bC669

Plygon Mumbai / WETH Bonds: 0x27c26188E418616172CBe860541029BfE728A1bA

Near BOS front end (coming soon): https://bos.gg/#/nearjordan.near/widget/AIAttestationRequest

Static page front end (coming soon): [../raw-web/AIAttestationRequest.html](../raw-web/AIAttestationRequest.html)

## How to install

1. Clone this repo and the dependency submodules and go to that folder:
```
git clone https://github.com/jordan-public/optimistic-ai-attestation
git submodule init
git submodule update
cd optimistic-ai-attestation
```

2. Install the dependencies
```
cd web
pnpm install
cd ../challenge-dispute
pnpm install
```

3. Make sure the values are properly set up in the ```.env``` file. Copy the ```.env.example``` and update the following values:
```
MNEMONIC
OPENAI_API_KEY
CHAIN_ID
RPC
```

4. Run the front-end locally
```
pnpm dev
```

## Usage

There are 3 roles:
1. Attester:
-  Visit the front-end after installing the above at ```http://localhost:3000```. 
- Paste the GPT API KEY in the top input field.
- Type or paste the question.
- Click on the button labeled "Query GPT-3.5-Turbo". The query will run and produce an answer and IPFD CID below the answers.
- Click on Request Attestation. The wallet (MetaMask) will ask you to sign the transaction. This transaction pulls the authorized amount as Bond.
- Once the dispute period is over, Settlement should be automated calling ```setSettleAssertion```. 

2. Disputer
- Pick up the Attestation ID and the which was generated as an event, also available on the web site.
- Run the utility:
```
cd challenge-dispute
node challenge.js <Attestation ID>
```
- Dispute the transaction by paying a bond based on th information from the above script and calling ```disputeAssertion(bytes32 assertionId, address disputer)```.


3. Voter
- Pick up the Attestation ID and the which was generated as an event, also available on the web site.
- Run the utility:
```
cd challenge-dispute
node challenge.js <Attestation ID>
```
This script outputs a confidence factor, which would help the voting decisions, and the voting itself can be automated based on the output from the above script.

For all automated participants, they can listen to the event ```DataAsserted(dataId, data, asserter, assertionId)``` to look for new opportunities (found in this repo in ```AIAttestationAsserter```; copied from samples). In this event, the IPFS CID is packed into the fields ```dataId``` and ```data``` concatenated (it's 46 bytes) and padded with spaces. This ```CID``` can be passed as the only parameter to ```challenge.js``` above.

The entire dispute process can be seen on the [UMA dashboard](https://mumbai.oracle.uma.xyz/).