import Router from 'express';
import validateToken from '../middlewares/validateTokenHandler.js';
import { createBorrow, acceptBorrow, returnBorrow, rejectBorrow, getMyBorrowRequests, getMyBorrows, getPendingRequests, getBorrowById, getAllBorrows, deleteBorrow } from '../Controllers/BorrowController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { idParam, createBody } from '../validators/borrow.js';

const router = Router();

router.use(validateToken);
router.post('/', validateRequest({ body: createBody }), createBorrow);
router.put('/:id/accept', validateRequest({ params: idParam }), acceptBorrow);
router.put('/:id/return', validateRequest({ params: idParam }), returnBorrow);
router.put('/:id/reject', validateRequest({ params: idParam }), rejectBorrow);
router.get('/my-requests', getMyBorrowRequests);
router.get('/my-borrows', getMyBorrows);
router.get('/pending-requests', getPendingRequests);
router.get('/:id', validateRequest({ params: idParam }), getBorrowById);
router.get('/', getAllBorrows);
router.delete('/:id', validateRequest({ params: idParam }), deleteBorrow);


export default router;