const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const userModel = require('../models/userModel')
const booksModel = require('../models/booksModel')
const reviewModel = require('../models/reviewModel')
const validator = require('../validator/validate')



//------------------------------------------------------------------------//

const createBook = function (req, res) {
    try {
        const requestBody = req.body
        const userIdFromToken = req.userId

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Book Detaills" })
        }

        if (!validator.isValidObjectId(ObjectId(userIdFromToken))) {
            return res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid Book id or not present ` })
        }

        let { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt } = requestBody

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide userId" })
        }
        userId = userId.trim()
        if (!validator.isValidObjectId(userId)) {             //!-------Ask Mentor------------//
            return res.status(400).send({ status: false, message: "userId provided is not valid" })
        }
        const user = userModel.findById(userId)

        if (!user) {
            return res.status(400).send({ status: false, message: `User does not exit` })
        }

        if (user._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Title" })
        }

        const isTitleAlreadyPresent = booksModel.findOne({ title })

        if (isTitleAlreadyPresent) {
            return res.status(400).send({ status: false, message: "Title Already Present" })
        }

        if (!validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide excerpt" })
        }

        if (!validator.isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide ISBN" })
        }
        const IsbnAlreadyPresent = booksModel.findOne({ ISBN: requestBody.ISBN })
        if (IsbnAlreadyPresent) {
            return res.status(400).send({ status: false, message: "ISBN is already present" })
        }
        if (!validator.isValid(category)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide category" })
        }
        if (!validator.isValid(subcategory)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide subcategory" })
        }
        if (!validator.isValid(releasedAt)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide date" })
        }
        if (!/^(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)$/.test(releasedAt)) {

            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide valid release date" })
        }
        //------------------------------------Validation Ends-------------------------------------------------------------//

        const updatedBody = { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt }
        let bookData = booksModel.create(updatedBody)
        return res.status(201).send({ status: true, message: 'Success', data: bookData })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}

const getBooks = async function (req, res) {  //!----- testing ----
    try {
        let queryParams = req.query;
        const obj = { isDeleted: false }

        if (validator.isValidRequestBody(queryParams)) {
            const { userId, category, subcategory } = queryParams

            if (validator.isValid(userId) && validator.isValidObjectId(userId)) {
                obj['userId'] = userId;
            }
            if (validator.isValid(category)) {
                obj['category'] = category;
            }
            if (validator.isValid(subcategory)) {
                obj['subcategory'] = subcategory;
            }
        }

        let book = await booksModel.find(obj).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
        if (!book) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, No such book present" })
        }

        let sortedByTitle = book.sort((a, b) => a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1)   //!---Ask Mentor---

        if (sortedByTitle.length == 0) {
            return res.status(204).send({ status: true })
        }

        res.status(200).send({ status: true, data: book })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}

const getBooksByID = async function (req, res) {
    let params = req.params
    let bookId = params.bookId

    if (!validator.isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

    }
    if (!validator.isValid(bookId)) {
        return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

    }
    let reviewsData = await reviewModel.find({ bookId }).select({ isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 })
    let book = await booksModel.findOne({ _id: bookId, isDeleted: false }).select({ __v: 0 })
    if (!book) {
        return res.status(404).send({ status: false, message: `Book not found Or is been delete` })
    }
    let iBook = book.toObject()                    //!-Ask mentor--------------------------review
    if (reviewsData) {
        iBook['reviewsData'] = reviewsData
    }
    //book.save()

    //book['reviewsData'] =reviewsData
    res.status(200).send({ status: true, data: iBook })


}

const updateBooks = async function (req, res) {

    try {
        const requestBody = req.body
        const params = req.params
        const bookId = params.bookId
        const userIdFromToken = req.userId



        if (!validator.isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid book id` })
            return
        }

        if (!validator.isValidObjectId(ObjectId(userIdFromToken))) {
            return res.status(400).send({ status: false, message: `${userIdFromToken} Unauthorized access! Owner info doesn't match ` })
        }

        const book = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: `Book not found` })
        }

        if (book.userId.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }

        if (!validator.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'No paramateres passed. book unmodified' })
            return
        }

        // Extract params
        const { title, excerpt, releasedAt, ISBN } = requestBody;


        if (!validator.validString(title)) {
            return res.status(400).send({ status: false, message: 'Title Required' })
        }



        if (!validator.validString(excerpt)) {
            return res.status(400).send({ status: false, message: 'excerpt Required' })
        }


        if (!validator.validString(ISBN)) {
            return res.status(400).send({ status: false, message: 'ISBN Required' })
        }


        if (!validator.validString(releasedAt)) {
            return res.status(400).send({ status: false, message: 'releasedAt Date Required' })
        }

        let isTitleAlreadyPresent = await booksModel.findOne({ title })
        if (isTitleAlreadyPresent) {
            return res.status(400).send({ status: false, message: 'Title alredy present' })
        }


        let isISBNAlreadyPresent = await booksModel.findOne({ ISBN })
        if (isISBNAlreadyPresent) {
            return res.status(400).send({ status: false, message: 'ISBN alredy present' })
        }

        if (releasedAt) {
            if (!/^(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)$/.test(releasedAt)) {

                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide valid release date" })
            }
        }
        ///---------------------------------------Validation Ends --------------------------------//

        const updatedBookData = await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false },
            {
                $set:
                {
                    title: title,
                    excerpt: excerpt,
                    releasedAt: releasedAt,
                    ISBN: ISBN,
                }
            }, { new: true }
        )

        res.status(201).send({ status: true, data: updatedBookData })

    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

const deleteByBookId = async function (req, res) {
    let bookId = req.params.bookId
    const userIdFromToken = req.userId

    if (!validator.isValidObjectId(bookId)) {
        res.status(400).send({ status: false, message: `${bookId} is not a valid book id` })
        return
    }

    if (!validator.isValidObjectId(ObjectId(userIdFromToken))) {
        return res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid Book id or not present ` })
    }

    let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
    if (!book) {
        return res.status(400).send({ status: false, message: `${bookId}  not found or alredy deleted` })
    }

    if (book.userId.toString() !== userIdFromToken) {
        res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        return
    }

    let udatedData = await booksModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date(), reviews: 0 } }, { new: true })
    await reviewModel.updateMany({ bookId: bookId }, { isDeleted: true })
    res.status(201).send({ status: true, message: `Book deleted successfully`, data: udatedData })

}

module.exports = {
    createBook, getBooks, getBooksByID, updateBooks, deleteByBookId
}