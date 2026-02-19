
import { getNGO, getAllNGOs } from './src/dbQueries/ngo.Queries.js';
import dotenv from 'dotenv';
dotenv.config();

async function listAllNGOs() {
    try {
        console.log('--- FETCHING ALL NGOs ---');
        const ngos = await getAllNGOs();
        console.log(`Found ${ngos.length} NGOs:`);
        ngos.forEach(ngo => {
            console.log(`ID: ${ngo.id}`);
            console.log(`Name: ${ngo.name}`);
            console.log(`Email: ${ngo.email}`);
            console.log(`Wallet: ${ngo.walletAddress}`);
            console.log(`Password Hash: ${ngo.password ? '[HAS PASSWORD]' : '[NO PASSWORD]'}`);
            console.log('-------------------------');
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listAllNGOs();
