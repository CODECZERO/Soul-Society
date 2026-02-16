import { Router } from 'express';
import { submitProof, verifyProof } from '../controler/postProof.controler.js';
const router = Router();
router.post('/:id/submit-proof', submitProof);
router.post('/:id/verify-proof', verifyProof);
export default router;
//# sourceMappingURL=postProof.routes.js.map