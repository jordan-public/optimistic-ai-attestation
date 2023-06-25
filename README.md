# UMAIA - Optimistic AI Attestations

## Demo

Follow [this link](./demo/README.md) for demo instructions.

## How to deploy and integrate

Follow [this](/HOWTO.md) link.

## Abstract

Attestation whether a certain AI query was executed, and a specific answer was returned is important to many users. Use cases range from financial accountability, medical record keeping and many other.

This is a system which uses on-chain optimistic oracles in order to attest the authenticity of the query and its results. It works even when non-deterministic AI models are used.

## Introduction

Imagine a fund submitting a financial report from a public company to a Large Language AI Model (LLM) along with a request for an opinion on certain financial indicators about the state of the reporting entity. In turn, an investment decision is influenced by the answer. It would be hard to pinpoint the accountable party if there is no attested record of the request to the LLM and its reply. The operator could modify the answer for illegitimate financial gain. 

Imagine a physician using an LLM for diagnosis assistance. In case of an incorrect diagnosis, the physician could be liable, but there is a difference between misconduct and honest error. In order to delineate between the two and avoid accusations, an attestation of the LLM query and answer would help.

This work provides an user interface for querying a chosen LLM, and automatic generation of attestations recorder on a blockchain.

## Problems

An exact proof of the LLM execution is not feasible. Let's take two possibilities:
1. Cryptographic Validity Proof (frequently mistermed as "Zero Knowledge Proof"). Querying (not training) of a practical LLM at the time of writing this requires a machine few terabytes of storage, between 50 and 100 megabytes of RAM and a powerful CPU, to produce answers within a few seconds. To generate a Validity Proof of the LLM execution (calling it ZK Proof with disagreement) with today's technology of cryptographic methods and computation power, is simply not feasible. Simple millisecond calculations take minutes to produce the proofs, so the above computation is simply not feasible.
2. Consensus based attestation seems more feasible, but it is still unnecessarily expensive. There is no logical need for numerous participants to execute the same LLM and the cost would still be prohibitively high.

To top it off, the above possibilities require strict deterministic and repeatable execution. In reality, all practical LLMs today are non-deterministic. Namely, when asked a question multiple times, they may return different answers. This happens even without added randomness. For example the OpenAI GPT models have a Temperature parameter, which ranges from 0 to 1, zero being most deterministic and 1 adding most practically usable randomness to the execution. Still, even with Temperature set to 0, these LLMs respond differently to the same question when asked multiple times. Apparently this non-determinism stems from attempts to produce statistically fair rounding off the reduced-precision weights in the Neural Network. Another reason is race conditions in the parallel execution of AI processor cells (graphic cards, TPUs and other AI processors), which is impractically expensive and unnecessary to mitigate..

## Solution

To solve the above issues, an Optimistic Oracle us used. This Optimistic Oracle us implemented by the on-chain protocol UMA. Here is the sequence of steps:
- The LLM query is executed.
- Request for Attestation is created. It contains the LLM query and answer along with some metadata, such as timestamp, LLM model and version, etc.
- The Request is sent to UMA along with a Bond. This Bond serves as a guarantee that the Request for Attestation is genuine (unaltered with malicious intent).
- The UMA protocol allows for disputes (challenges) within a certain period. Each dispute contains its own Bond deposit, which is forfeited in favor of the requester in case of a frivolous or malicious incorrect dispute.
- If there are no such disputes, the requester can commit the attestation and receive the deposited Bond.
- If a challenger succeeds, the attestation fails, and the challenger receives the deposited Bond as well as large part of the attester's Bond.
- The dispute process is hopefully not frequent. When it happens, the dispute is resolved by voting of the UMA stakeholders. They have a chance to vote, and whoever votes in accordance to the final outcome is rewarded, which provides economic incentive for their honesty.

This solution allows for fuzzy decision making, namely when LLM answer cannot be executed. Still the **dispute process should not be manual** in practice. To achieve this, the LLM queries are engineered in the following way:
- The requesters query Q produces an answer A. This is recorded in the request.
- The dispute resolution voting members run automated jobs. Each job asks the LLM the question: "When asked Q you answered A. Is this correct? Rate the correctness and answer with a number between 0 and 1, which estimates the likelyhood of correctness.". The automated job could then vote on the basis of the returned number.

## Implementation

1. The Attestation Request front end is implemented in Near BOS and written in JavaScript:
- It calls the LLM via its RPC API. 
- It records to the request to IPFS and stores it in a decentralized manner by "pinning" it. The pinning can happen on the local IPFS node of the requester, who has economic interest in keeping it pinned (stored) for the duration of the attestation process. Note that the IPFS CID of the entire attestation request uniquely determines its content, and serves as secure hash as well as storage.
- It starts the UMA Optimistic Oracle process, by asking the user to sign an on-chain transaction.
- When and if there is no challenge, the user can commit the assertion on-chain.

2. The Smart Contracts are written in Solidity and call on the UMA protocol fot their Optimistic Oracle functionality. The dispute process can be observed via the UMA web user interface.

3. The disputer and voting user interface is a command line utility written as shell script and JavaScript, because it executes in an automated manner. It is called with a parameter, which is ID of the UMA assertion. This assertion contains the IPFS CID of the Assertion Request, from which the LLM query and answer are retrieved. The new LLM engineered correctness query is composed and sent to the LLM for estimate of correctness. Finally, the estimation of correctness is displayed. If this program is called by the challenger, an UMA dispute is generated on-chain. If it is called by the dispute resolution voter, a vote is cast on-chain.
