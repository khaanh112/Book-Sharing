import Router from 'express';
import { getAllBooks, getBookById, createBook, updateBook, deleteBook, getMyBooks, searchBooks } from '../Controllers/BookController.js';
import validateToken from '../middlewares/validateTokenHandler.js';
import upload from '../middlewares/uploadCloudinary.js';
import validateRequest from '../middlewares/validateRequest.js';
import { idParam, listQuery, searchQuery, createBody, updateBody } from '../validators/book.js';




const router = Router();


router.use(validateToken);


router.get('/', validateRequest({ query: listQuery }), getAllBooks);
router.get('/my-books', getMyBooks);
router.get("/search", validateRequest({ query: searchQuery }), searchBooks);
router.get('/:id', validateRequest({ params: idParam }), getBookById); // Tìm kiếm sách theo title hoặc author
router.post('/', upload.single('thumbnail'), validateRequest({ body: createBody }), createBook);
router.put('/:id', validateRequest({ params: idParam, body: updateBody }), updateBook);
router.delete('/:id', validateRequest({ params: idParam }), deleteBook);


export default router;
