const express = require('express');
const mongoose = require('mongoose')
const router = express.Router();

const UserController = require('../controller/userController')
const BookController=require('../controller/booksController')
const ReviewController=require('../controller/reviewController')
const loginCheck=require('../Middleware/userAuth')

router.get('/test-me', function (req, res) {
    res.send('My first ever api!')
});


//registerUser API
router.post("/register", UserController.registerUser)
//LoginUser API
router.post('/login', UserController.loginUser)
// create Book API
router.post('/books',loginCheck.userAuth,BookController.createBook)   //!----Authorisation
// get Books  API
router.get('/books',loginCheck.userAuth,BookController.getBooks)
// get BooksByID API
router.get('/books/:bookId',loginCheck.userAuth, BookController.getBooksByID)
// put update API 
router.put('/books/:bookId' ,loginCheck.userAuth,BookController.updateBooks ) //!-----Authorisation
// Delete Book API
router.delete('/books/:bookId' ,loginCheck.userAuth,BookController.deleteByBookId) //!-------Authorisation

//Review API
//Create Review API
router.post('/books/:bookId/review',ReviewController.createReview)
//update review API
router.put('/books/:bookId/review/:reviewId', ReviewController.updateReview)
//Delete Review API
router.delete('/books/:bookId/review/:reviewId',ReviewController.deleteReview )
module.exports = router;