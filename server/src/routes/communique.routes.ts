import { Router } from 'express';
import { createCommunique, getDivisionCommuniques } from '../controler/communique.controler.js';

const router = Router();

router.post('/', createCommunique);
router.get('/:ngoId', getDivisionCommuniques);

export default router;
