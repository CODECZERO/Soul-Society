import { seireiteiVault } from '../src/services/stellar/seireiteiVault.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function dumpDonations() {
    try {
        console.log('--- Dumping Donations from Vault ---');
        const donations = await seireiteiVault.getAll('Donations');
        console.log(`Total Donations: ${donations ? donations.length : 0}`);

        if (donations) {
            donations.slice(-20).forEach((d, i) => {
                console.log(`${i + 1}. ID: ${d._id}, Donor: ${d.Donor}, Amount: ${d.Amount}, Txn: ${d.currentTxn?.substring(0, 10)}...`);
            });
        }

        const walletAddr = 'GB5GF6YMRVW43J7HYLFBDNM4J6ODLB4I74RBB3FV3AVFDZ36FN7JGKRF';
        console.log(`\n--- Searching for Wallet: ${walletAddr} ---`);

        const donorDonations = (donations || []).filter(d => d.Donor === walletAddr);
        console.log(`Found ${donorDonations.length} exact matches for Donor field.`);

        const partialMatches = (donations || []).filter(d => d.Donor && d.Donor.includes(walletAddr.substring(0, 10)));
        console.log(`Found ${partialMatches.length} partial matches for Donor field.`);

        const txnMatches = (donations || []).filter(d => d.currentTxn && d.currentTxn.includes(walletAddr.substring(0, 5)));
        console.log(`Found ${txnMatches.length} matches where currentTxn contains wallet substring (Old logic).`);

    } catch (error) {
        console.error('Error dumping donations:', error);
    }
}

dumpDonations();
