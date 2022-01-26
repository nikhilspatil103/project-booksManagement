const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const userModel = require('../models/userModel')
const booksModel = require('../models/booksModel')
const reviewModel = require('../models/reviewModel')
const validator=require('../validator/validate')



//-----------------------------------------------------------------------------------------//


const createReview = async function (req, res) {
    try {
        let params = req.params
        let bookId = params.bookId

        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

        }
        if (!validator.isValid(bookId)) {
            return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

        }

        let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: `Book not found` })
        }

        let requestBody = req.body
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Book Detaills" })

        }
        // Extract Params
        const { reviewedBy, reviewedAt, rating, review } = requestBody

        if (!validator.validString(reviewedBy)) {
            return res.status(400).send({ status: false, message: 'reviewedBy Required' })
        }

        if (!validator.isValid(rating)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide rating" })
        }

        if (!(rating >= 1 && rating <= 5)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide rating between 1 to 5" })
        }
        if (!(rating % 1 == 0)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide integer rating  between 1 to 5" })
        }

        //-------------------Validation Ends--------------------------------------------//
        let updateReview = {
            bookId: bookId,
            reviewedBy: reviewedBy,
            reviewedAt: Date.now(),
            rating: rating,
            review: review
        }
        let data = await reviewModel.create(updateReview)
        let newData = await reviewModel.findOne(updateReview).select({ createdAt: 0, updatedAt: 0, __v: 0 })

        await booksModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: 1 } })

        res.status(201).send({ status: true, data: newData })
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

const updateReview = async function (req, res) {
    try {
        const requestBody = req.body
        const bookId = req.params.bookId
        const reviewId = req.params.reviewId

        if (!validator.isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid book id` })
            return
        }

        if (!validator.isValidObjectId(reviewId)) {
            res.status(400).send({ status: false, message: `${reviewId} is not a valid book id` })
            return
        }

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No paramateres passed. review unmodified" })

        }
        let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: `Book not found` })
        }
        let bookReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!bookReview) {
            return res.status(404).send({ status: false, message: `review not found` })
        }
        // Extract params
        let { review, rating, reviewedBy, reviewedAt } = requestBody;


        if (!validator.validString(review)) {
            return res.status(400).send({ status: false, message: 'review Required' })
        }


        if (typeof (rating) === 'number') {
            if (!(rating == 1 || rating == 2 || rating == 3 || rating == 4 || rating == 5)) {
                return res.status(400).send({ status: false, message: ' please provide rating between 1 to 5' })
            }

        }
        




        if (!validator.validString(reviewedBy)) {
            return res.status(400).send({ status: false, message: 'Reviewed by Required' })
        }

        ///---------------------------------------Validation Ends --------------------------------//

        const updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId, isDeleted: false },
            {
                $set:
                {
                    review: review,
                    rating: rating,
                    reviewedBy: reviewedBy,
                    reviewedAt: Date.now()
                }
            }, { new: true }
        )
        let reviewsData = await reviewModel.find({ bookId })
        let iBook = book.toObject()                   

        if (reviewsData) {
            iBook['reviewsData'] = reviewsData
        }
        res.status(201).send({ status: true, data: iBook })
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }

}

const deleteReview = async function (req, res) {
    let bookId = req.params.bookId
    let reviewId = req.params.reviewId
    if (!validator.isValidObjectId(bookId)) {
        res.status(400).send({ status: false, message: `${bookId} is not a valid book id` })
        return
    }
    if (!validator.isValidObjectId(reviewId)) {
        res.status(400).send({ status: false, message: `${reviewId} is not a valid review id` })
        return
    }

    let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
    if (!book) {
        return res.status(400).send({ status: false, message: `${bookId}  not found or alredy deleted` })
    }
    let review = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
    if (!review) {
        return res.status(400).send({ status: false, message: `${reviewId}  not found or alredy deleted` })
    }


    let udatedData = await reviewModel.findOneAndUpdate({ _id: reviewId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
    await booksModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } })
    res.status(201).send({ status: true, message: `Book Review deleted successfully`, data: udatedData })

}
module.exports = {
    createReview, updateReview, deleteReview
}