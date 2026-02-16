import { Request, Response, NextFunction } from 'express';
declare const AsyncHandler: (requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export default AsyncHandler;
//# sourceMappingURL=asyncHandler.util.d.ts.map