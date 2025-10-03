import Router from 'express';
import { getAllBooks, getBookById, createBook, updateBook, deleteBook, getMyBooks, searchBooks } from '../Controllers/BookController.js';
import validateToken from '../middlewares/validateTokenHandler.js';
import upload from '../middlewares/uploadCloudinary.js';




const router = Router();


router.use(validateToken);


router.get('/', getAllBooks);
router.get('/my-books', getMyBooks);
router.get("/search", searchBooks);
router.get('/:id', getBookById); // Tìm kiếm sách theo title hoặc author
router.post('/', upload.single('thumbnail'), createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);


export default router;
