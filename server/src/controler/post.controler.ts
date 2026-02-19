import { NextFunction, Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getPosts, savePostData } from '../dbQueries/post.Queries.js';
import { getAllDonation, getDonationRelatedToPost } from '../dbQueries/donation.Queries.js';
import { getNGO } from '../dbQueries/ngo.Queries.js';
import { getXLMtoINRRate } from '../util/exchangeRate.util.js';
import { ImgFormater } from '../util/ipfs.uitl.js';
import { registerMission } from '../services/stellar/smartContract.handler.stellar.js';

export interface PostData {
  Title: string;
  Type: string;
  Description: string;
  Location: string;
  ImgCid: string;
  NeedAmount: string;
  WalletAddr: string;
  NgoRef?: string; // Now a string ID (Vault), not ObjectId
  Status?: 'Active' | 'Completed' | 'Failed';
  DangerLevel?: 'Low' | 'Medium' | 'High' | 'Extreme';
}

interface RequestK extends Request {
  NgoId?: string;
  user?: {
    id: string;
    email: string;
    walletAddr: string;
    NgoName: string;
    privateKey?: string;
  };
}

const getAllPost = AsyncHandler(async (req: Request, res: Response) => {
  try {
    const postData = await getPosts();
    if (!postData) throw new ApiError(404, 'post data not found');

    // Get live XLM to INR exchange rate
    const XLM_TO_INR_RATE = await getXLMtoINRRate();
    console.log(`📊 Using XLM/INR rate: ₹${XLM_TO_INR_RATE}`);

    // Optimization: Bulk fetch ALL donations once and group them
    const allDonations = await getAllDonation();
    const donationsMap = new Map<string, any[]>();
    (allDonations || []).forEach((d: any) => {
      const pId = d.postIDs || d.PostID || d.postId;
      if (pId) {
        const existing = donationsMap.get(pId) || [];
        existing.push(d);
        donationsMap.set(pId, existing);
      }
    });

    // Calculate collected amount for each post using the map
    const postsWithCollected = await Promise.all(
      postData.map(async (post) => {
        try {
          // Use the pre-fetched map for donations
          const donations = donationsMap.get(post._id) || [];

          // Sum XLM amounts and convert to INR
          const collectedXLM = donations.reduce((sum: number, donation: any) => {
            return sum + (donation.Amount || 0);
          }, 0);
          const collectedINR = collectedXLM * XLM_TO_INR_RATE;

          // Plain object from Vault (no .toObject() needed)
          const postObj: any = { ...post };

          // Hydrate missing WalletAddr and NgoName from NGO data
          if (postObj.NgoRef) {
            try {
              const ngo = await getNGO(postObj.NgoRef);
              if (ngo) {
                if (!postObj.WalletAddr && ngo.walletAddress) {
                  postObj.WalletAddr = ngo.walletAddress;
                }
                // Add NGO details for frontend display
                postObj.NgoName = ngo.NgoName || ngo.name || postObj.NgoName;
              }
            } catch (e) {
              // Silently ignore
            }
          }

          // Format the image URL if ImgCid exists
          if (post.ImgCid) {
            try {
              postObj.ImgCid = (await ImgFormater(post.ImgCid)) || '';
            } catch (error) {
              console.error(`Error formatting image URL for post ${post._id}:`, error);
              postObj.ImgCid = '';
            }
          } else {
            postObj.ImgCid = '';
          }

          return {
            ...postObj,
            CollectedAmount: Math.round(collectedINR),
          };
        } catch (error) {
          console.error(`Error processing post ${post._id}:`, error);
          return {
            ...post,
            CollectedAmount: 0,
            ImgCid: post.ImgCid ? await ImgFormater(post.ImgCid).catch(() => '') : '',
          };
        }
      })
    );

    return res.status(200).json(new ApiResponse(200, postsWithCollected, 'found data'));
  } catch (error) {
    console.error('Error in getAllPost:', error);
    throw error;
  }
});

const createPost = AsyncHandler(async (req: RequestK, res: Response) => {
  const postData: PostData = req.body;

  if (!req.user || !req.user.walletAddr) {
    throw new ApiError(401, 'User wallet address not found. Please connect your wallet.');
  }

  postData.WalletAddr = req.user.walletAddr;

  // Set NgoRef as a plain string ID (no more ObjectId)
  if (req.NgoId) {
    postData.NgoRef = req.NgoId;
  } else {
    throw new ApiError(401, 'NGO authentication required');
  }

  if (!postData.Title || !postData.Description || !postData.NeedAmount) {
    throw new ApiError(400, 'Title, description, and amount are required');
  }

  postData.Status = postData.Status || 'Active';
  postData.DangerLevel = postData.DangerLevel || 'Low';

  const saveData = await savePostData(postData);
  if (!saveData) {
    throw new ApiError(500, 'Failed to save post data');
  }

  // Register on Mission Registry (On-Chain)
  try {
    const dangerLevelMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Extreme: 4 };
    const numericDanger = dangerLevelMap[postData.DangerLevel || 'Low'] || 1;

    const privateKey = req.user.privateKey || process.env.DEFAULT_CAPTAIN_S_KEY;
    if (privateKey) {
      await registerMission(
        privateKey,
        saveData._id.toString(),
        postData.Title,
        numericDanger
      );
      console.log(`📜 Mission ${saveData._id} registered on-chain.`);
    }
  } catch (chainError) {
    console.warn('On-chain registration failed:', chainError);
  }

  const responseData = { ...saveData };
  if (responseData.ImgCid) {
    responseData.ImgCid = await ImgFormater(responseData.ImgCid).catch(() => responseData.ImgCid);
  }

  return res.status(200).json(new ApiResponse(200, responseData, 'Post created successfully'));
});

export { createPost, getAllPost };
