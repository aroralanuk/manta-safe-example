import { ethers } from "ethers";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import pkg from "@safe-global/safe-core-sdk";
const { SafeFactory, SafeAccountConfig } = pkg;
const Safe = pkg.default;


const contractNetworks = {
    // Chain ID == 169
    169: {
        multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
        multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
        safeMasterCopyAddress: "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
        safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
        fallbackHandlerAddress: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4",
        signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
        createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
        simulateTxAccessorAddress: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da",
    },
};


const main = async () => {
    const PRIVATE_KEY =
        "52ae60ca5c9103f90d4f3d43f63fd0a7dcf5ee55daf2ad57f74baad50f0da4cb"; // 0x0000FF3c92F958237Ebe16f6aF528d7F060baBE2

    const provider = new ethers.providers.JsonRpcProvider(
        "https://pacific-rpc.manta.network/http"
    );
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const ethAdapter = new EthersAdapter.default({
        ethers,
        signerOrProvider: signer,
    });

    const safeFactory = await SafeFactory.create({
        ethAdapter,
        contractNetworks,
    });
    const owners = [signer.address];
    const threshold = 1;
    const safeAccountConfig = {
        owners,
        threshold,
    };

    // Create new safe contract account
    
    const safe = await safeFactory.deploySafe({ safeAccountConfig });
    const safeAddress = safe.getAddress();
    console.log("Created safe at", safeAddress);

    // Connect to existing safe contract account
    const safeAgain = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks,
        isL1SafeMasterCopy: false,
    });
    console.log("connected to safe at", safeAgain.getAddress()); // should be the same as above

    // Fund safe account
    const fundingTx = await signer.sendTransaction({
        to: safeAddress,
        value: ethers.utils.parseEther("0.001"),
    });
    const r = await fundingTx.wait() // wait for funding tx to complete
    console.log("Sent funding transaction to safe: ", r.transactionHash)
    

    // Sending a transaction
    const safeTransaction = await safeAgain.createTransaction({
        safeTransactionData: {
            to: "0x0000000000000000000000000000000000000000",
            value: "1",
            data: "0x",
        },
    });
    const signedSafeTransaction = await safeAgain.signTransaction(safeTransaction);
    const txResponse = await safeAgain.executeTransaction(signedSafeTransaction);
    console.log("Executed safe transaction: ", txResponse.hash);
};

main();
