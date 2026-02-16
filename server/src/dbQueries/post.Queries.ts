import { PostData } from '../controler/post.controler.js';
import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { nanoid } from 'nanoid';

const getPosts = async (): Promise<any[]> => {
  try {
    console.log('[VAULT] Fetching all posts from blockchain...');
    return await seireiteiVault.getAll('Posts');
  } catch (error) {
    console.error('Blockchain retrieval failed while fetching posts:', error);
    return [];
  }
};

const savePostData = async (postData: PostData) => {
  try {
    if (!postData) throw new Error('Invalid data');

    const postId = nanoid(); // Generate a unique on-chain ID

    const saveData = {
      _id: postId,
      Title: postData.Title,
      Type: postData.Type,
      Description: postData.Description,
      Location: postData.Location,
      ImgCid: postData.ImgCid,
      NgoRef: postData.NgoRef,
      NeedAmount: postData.NeedAmount,
      WalletAddr: postData.WalletAddr,
      Status: postData.Status,
      DangerLevel: postData.DangerLevel,
    };

    await seireiteiVault.put('Posts', postId, saveData);

    console.log(`[VAULT] Post saved to blockchain with ID: ${postId}`);
    return saveData;
  } catch (error) {
    return error;
  }
};

export { savePostData, getPosts };
