import { AleoNetworkClient } from "@provablehq/sdk";

const data = async () => {
    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
    const transaction = await networkClient.getConfirmedTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
    const transactionObject = await networkClient.getTransactionObject("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
    // Get the transaction inputs as a JS array.
    const transactionOutputs = transactionObject.inputs(true);
    
    // Get the transaction outputs as a JS object.
    const transactionInputs = transactionObject.outputs(true);
    
    // Get any records generated in transitions in the transaction as a JS object.
    const records = transactionObject.records();
    
    // Get the transaction type.
    const transactionType = transactionObject.transactionType();
    
    // Get a JS representation of all inputs, outputs, and transaction metadata.
    const transactionSummary = transactionObject.summary();
}