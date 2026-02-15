import { postModel, IPost } from '../model/post.model.js';
import { PostData } from '../controler/post.controler.js';

const getPosts = async (): Promise<IPost[]> => {
  try {
    return await postModel.find();
  } catch (error) {
    console.error('Database connection failed while fetching posts:', error);
    return [];
  }
};

const savePostData = async (postData: PostData) => {
  try {
    if (!postData) throw new Error('Invalid data');
    const saveData = await postModel.create({
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
    });
    if (!saveData) throw new Error('Failed to save post data');
    return saveData;
  } catch (error) {
    return error;
  }
};

export { savePostData, getPosts };
