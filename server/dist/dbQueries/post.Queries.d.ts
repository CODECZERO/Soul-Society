import { IPost } from "../model/post.model.js";
import { PostData } from "../controler/post.controler.js";
declare const getPosts: () => Promise<IPost[]>;
declare const savePostData: (postData: PostData) => Promise<any>;
export { savePostData, getPosts };
//# sourceMappingURL=post.Queries.d.ts.map