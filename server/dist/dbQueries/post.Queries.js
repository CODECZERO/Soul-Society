import { postModel } from "../model/post.model.js";
const getPosts = async () => {
    try {
        return await postModel.find();
    }
    catch (error) {
        throw error;
    }
};
const savePostData = async (postData) => {
    try {
        if (!postData)
            throw new Error("Invalid data");
        const saveData = await postModel.create({
            Title: postData.Title,
            Type: postData.Type,
            Description: postData.Description,
            Location: postData.Location,
            ImgCid: postData.ImgCid,
            NgoRef: postData.NgoRef,
            NeedAmount: postData.NeedAmount,
            WalletAddr: postData.WalletAddr,
        });
        if (!saveData)
            throw new Error("Failed to save post data");
        return saveData;
    }
    catch (error) {
        return error;
    }
};
export { savePostData, getPosts };
//# sourceMappingURL=post.Queries.js.map