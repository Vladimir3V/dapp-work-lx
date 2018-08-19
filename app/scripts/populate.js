const Web3 = require('web3');
const contract = require('truffle-contract');
const contractData = require('../../build/contracts/DappWork.json');
const sampleData = require('../sample-data.json');

const ethRPC = "http://localhost:8545";

let web3 = new Web3(new Web3.providers.HttpProvider(ethRPC));
const DappWork = contract(contractData);
DappWork.setProvider(web3.currentProvider);

web3.eth.getAccounts((error, accounts) => {
    if (error) {
        console.error('Failed to get accounts. ', error);
        return;
    }
    DappWork.deployed().then(async instance => {
        // we're all set, let's stuff the contract with some sample data now
        await populate(instance, accounts);
    }).catch(error => {
        console.error(error);
    });
});

async function populate(dappWork, accounts) {
    try {
        // check if we have the owner's account
        if (await dappWork.owner.call() !== accounts[0]) {
            return console.log("account#0 is not an 'owner' in ", ethRPC);
        }
        else {
            console.log("Account#0 is contract 'owner'");
            await dappWork.addModer(accounts[1], {from: accounts[0]});
            console.log("Added account#1 as 'moder'");
            for (let i = 0; i < sampleData.orders.length; i++) {
                let order = sampleData.orders[i];
                let acc = accounts[i % 3 + 2];
                await dappWork.createOrder(order.title, order.email, order.contact, 
                    order.text_hash, order.file_hash,
                    {from: acc, value: web3.toWei(order.price, 'ether'), gas: 3000000});
                console.log('Added order#', i + 1, " with title '" + order.title + "' owned by account#" + (i % 3 + 2), "(" + acc.slice(0, 6) + "..." + acc.slice(-4) + ")");
            }
            let orders_length = await dappWork.getOrdersCount();
            console.log('Added ', orders_length.toNumber(), ' orders to the contract')
        }
    } catch (e) {
        if (/revert/.test(e.message)) {
            console.error('Transaction reverted. Contract data not empty?');
        } else {
            console.error('Failed to populate the contract with data. ', e.message);
        }
    }
}