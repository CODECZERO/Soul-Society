import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { userSingupData, userLoginData } from '../controler/userNgo.controler.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

interface userData {
  email?: string;
  Id?: string;
}

const findUser = async (userData: userData) => {
  try {
    if (!userData || (!userData?.email && !userData?.Id))
      throw new Error('Provide email address or Id');

    if (userData.email) {
      const user = await seireiteiVault.getByIndex('Users', 'Email', userData.email);
      return user ? [user] : [];
    } else {
      const user = await seireiteiVault.get('Users', userData.Id!);
      return user ? [user] : [];
    }
  } catch (error) {
    throw error;
  }
};

const saveDataAndToken = async (userData: userSingupData) => {
  try {
    if (!userData) throw new Error('User data is required');

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userId = nanoid();

    const data = {
      _id: userId,
      Email: userData.email,
      NgoName: userData.ngoName,
      RegNumber: userData.regNumber,
      Description: userData.description,
      PublicKey: userData.PublicKey,
      PrivateKey: userData.PrivateKey,
      walletAddr: userData.walletAddr || userData.PublicKey,
      PhoneNo: userData.phoneNo,
      Password: hashedPassword,
    };

    await seireiteiVault.putWithIndex('Users', userId, data, 'Email', userData.email);

    const accessToken = jwt.sign(
      { id: userId, email: data.Email, NgoName: data.NgoName, walletAddr: data.PublicKey },
      process.env.ATS as string,
      { expiresIn: (process.env.ATE as any) || '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: userId, walletAddr: data.PublicKey },
      process.env.RTS as string,
      { expiresIn: (process.env.RTE as any) || '7d' } as jwt.SignOptions
    );

    return {
      success: true,
      accessToken,
      refreshToken,
      userData: {
        Id: userId,
        Email: data.Email,
        NgoName: data.NgoName,
        PublicKey: data.PublicKey,
      },
    };
  } catch (error: any) {
    console.error('Error in saveDataAndToken:', error.message);
    throw error;
  }
};

const findUserWithTokenAndPassCheck = async (userData: userLoginData) => {
  try {
    if (!userData || !userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    const user = await seireiteiVault.getByIndex('Users', 'Email', userData.email);
    if (!user) {
      throw new Error('User not found with this email');
    }

    const isValidPassword = await bcrypt.compare(userData.password, user.Password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.Email, NgoName: user.NgoName, walletAddr: user.PublicKey },
      process.env.ATS as string,
      { expiresIn: (process.env.ATE as any) || '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: user._id, walletAddr: user.PublicKey },
      process.env.RTS as string,
      { expiresIn: (process.env.RTE as any) || '7d' } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      userData: {
        Id: user._id,
        Email: user.Email,
        NgoName: user.NgoName,
        walletAddr: user.PublicKey,
        PublicKey: user.PublicKey,
      },
    };
  } catch (error) {
    return error;
  }
};

const getPrivateKey = async (postId: string): Promise<string> => {
  if (!postId) throw new Error('Post ID is required');

  // In decentralized vault, we retrieve post and then lookup NGO (User)
  const post = await seireiteiVault.get('Posts', postId);
  if (!post || !post.NgoRef) throw new Error('Post not found');

  const user = await seireiteiVault.get('Users', post.NgoRef);
  if (!user || !user.PrivateKey) throw new Error('NGO not found');

  return user.PrivateKey;
};

export { findUser, saveDataAndToken, findUserWithTokenAndPassCheck, getPrivateKey };
