source .env
#forge script script/AIAttestationAsserter.s.sol:Deploy --rpc-url "https://matic-mumbai.chainstacklabs.com" --sender $SENDER --private-key $PRIVATE_KEY --broadcast -vvvv

# Deployments
# Görli
#forge script script/AIAttestationAsserter.s.sol:Deploy --rpc-url $GOERLI_INFURA_RPC --broadcast -vvvv
# Mumbai
#forge script script/AIAttestationAsserter.s.sol:Deploy --rpc-url "https://matic-mumbai.chainstacklabs.com" --broadcast -vvvv
# Mumbai alternative RPC: https://rpc-mumbai.matic.today
# Gnosis
#forge script script/AIAttestationAsserter.s.sol:Deploy --rpc-url "https://rpc.gnosischain.com" --broadcast -vvvv

# Anvil - local testnet
forge script script/AIAttestationAsserter.s.sol:Deploy --rpc-url "http://127.0.0.1:" --broadcast -vvvv