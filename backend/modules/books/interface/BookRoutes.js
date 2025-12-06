import { Router } from 'express';
import { getAllBooks, getBookById, createBook, updateBook, deleteBook, searchBooks, getMyBooks, searchGoogleBooksAPI } from './BookController.js';
import validateToken from '../../../shared/middlewares/validateTokenHandler.js';
import upload from '../../../shared/middlewares/uploadCloudinary.js';
import validateRequest from '../../../shared/middlewares/validateRequest.js';
import { idParam, listQuery, searchQuery, createBody, updateBody } from '../../../shared/validators/book.js';




const router = Router();


router.use(validateToken);


router.get('/', validateRequest({ query: listQuery }), getAllBooks);
router.get('/my-books', getMyBooks);
router.get("/search", validateRequest({ query: searchQuery }), searchBooks);
router.get("/google-search", validateRequest({ query: searchQuery }), searchGoogleBooksAPI);
router.get('/:id', validateRequest({ params: idParam }), getBookById); // Tìm kiếm sách theo title hoặc author
router.post('/', upload.single('thumbnail'), createBook); // Removed validateRequest to allow both FormData and JSON
router.put('/:id', validateRequest({ params: idParam, body: updateBody }), updateBook);
router.delete('/:id', validateRequest({ params: idParam }), deleteBook);


export default router;
