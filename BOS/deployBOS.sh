#/bin/zsh
source ../.env
//cp ../out/DataAsserter.sol/DataAsserter.json src/
bos components deploy nearjordan.near sign-as nearjordan.near network-config mainnet sign-with-seed-phrase "$NEAR_SEED_PHRASE" --seed-phrase-hd-path 'm/44'\''/397'\''/0'\''' send
