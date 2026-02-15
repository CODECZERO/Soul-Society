declare const retriveFromIpfs: (cid: string) => Promise<{
    success: boolean;
    data: import("pinata").GetCIDResponse;
    cid: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    cid: string;
    data?: undefined;
}>;
declare const uploadOnIpfs: (data: Object) => Promise<{
    success: boolean;
    cid: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    cid?: undefined;
}>;
declare const uploadOnIpfsBill: (data: Express.Multer.File) => Promise<{
    success: boolean;
    cid: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    cid?: undefined;
}>;
declare const deleteIpfsData: (cid: string[]) => Promise<{
    success: boolean;
    cid: string[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    cid?: undefined;
}>;
export { retriveFromIpfs, uploadOnIpfs, deleteIpfsData, uploadOnIpfsBill };
//# sourceMappingURL=ipfs.services.d.ts.map