import Router from 'express';
import validateToken from '../middlewares/validateTokenHandler.js';
import { createBorrow, acceptBorrow, returnBorrow, rejectBorrow, getMyBorrowRequests, getMyBorrows, getPendingRequests, getBorrowById, getAllBorrows, deleteBorrow } from '../Controllers/BorrowController.js';

const router = Router();

router.use(validateToken);
router.post('/', createBorrow);
router.put('/:id/accept', acceptBorrow);
router.put('/:id/return', returnBorrow);
router.put('/:id/reject', rejectBorrow);
router.get('/my-requests', getMyBorrowRequests);
router.get('/my-borrows', getMyBorrows);
router.get('/pending-requests', getPendingRequests);
router.get('/:id', getBorrowById);
router.get('/', getAllBorrows);
router.delete('/:id', deleteBorrow);


export default router;