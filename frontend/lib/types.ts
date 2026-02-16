export interface Post {
    _id: string;
    Title: string;
    Type: string;
    Description: string;
    Location: string;
    ImgCid: string;
    NeedAmount: string;
    WalletAddr: string;
    NgoRef: string;
    CollectedAmount?: number;
    Status?: "Active" | "Completed" | "Failed";
    DangerLevel?: "Low" | "Medium" | "High" | "Extreme";
    // Backward compatibility
    id?: string;
    title?: string;
    category?: string;
    goal?: number;
    raised?: number;
    image?: string;
    ngo?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface NGO {
    _id: string;
    Email: string;
    NgoName: string;
    RegNumber: string;
    Description: string;
    PublicKey?: string;
    PrivateKey?: string;
    PhoneNo: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Donation {
    _id: string;
    currentTxn: string;
    postIDs: string;
    Amount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Expense {
    _id: string;
    currentTxn: any;
    postIDs: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface SignupData {
    ngoName: string;
    regNumber: string;
    description: string;
    email: string;
    phoneNo: string;
    password: string;
    publicKey?: string;
    privateKey?: string;
}

export interface DonationData {
    TransactionId: string;
    postID: string;
    Amount: number;
}

export interface PayWallet {
    PublicKey: string;
    PostId: string;
    Amount: number;
    Cid: string;
}

// Legacy type aliases
export type Mission = Post;
export type DivisionCaptain = NGO;
export type ReiatsuInfusion = Donation;
