import { Router } from "express";
import { getPreviousTransaction, createTransactionRecord } from "../controler/expense.controler.js";
const router = Router();
// GET /api/expenses/prev-txn/:postId - Get previous transaction for a post
router.get("/prev-txn/:postId", getPreviousTransaction);
// POST /api/expenses/create - Create new transaction record
router.post("/create", createTransactionRecord);
export default router;
//# sourceMappingURL=expense.routes.js.map