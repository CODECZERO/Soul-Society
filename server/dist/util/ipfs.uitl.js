import { CID } from "multiformats";
import dotenv from "dotenv";
dotenv.config();
const isValidCid = async (cid) => {
    try {
        CID.parse(cid);
        return true;
    }
    catch (error) {
        return false;
    }
};
const ImgFormater = async (cid) => {
    try {
        if (!process.env.PINATA_GATEWAY) {
            throw new Error('PINATA_GATEWAY is not defined in environment variables');
        }
        if (!cid) {
            return '';
        }
        return `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
    }
    catch (error) {
        console.error('Error formatting image URL:', error);
        return '';
    }
};
export { isValidCid, ImgFormater };
//# sourceMappingURL=ipfs.uitl.js.map