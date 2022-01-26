const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const validator=require('../validator/validate')


//------------------------------------------------------------------//

const registerUser = async function (req, res) {
    try {
        let requestBody = req.body
       

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide author Detaills" })
        }

        let { title, name, phone, email, password, address } = requestBody

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Title" })
        }
        //title = title.split(" ").join("")
        if (!validator.isValidTitle(title.trim())) {
            return res.status(400).send({ status: false, message: " please provide valid Title" })
        }

        if (!validator.isValid(name)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Name" })
        }
        phone = phone.trim()
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone" })
        }

        //if (!/^[0-9]\d{9}$/gi.test(mobile)) {
        if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
            //if (!/^\+(?:[0-9] ?){10,12}[0-9]$/.test(mobile)) {
            return res.status(400).send({ status: false, message: `Mobile should be a valid number` });

        }

        let isPhoneAlredyPresent = await userModel.findOne({ phone: requestBody.phone })

        if (isPhoneAlredyPresent) {
            return res.status(400).send({ status: false, message: `Phone Number Already Present` });
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
        }
        email = email.trim()
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }

        let isEmailAlredyPresent = await userModel.findOne({ email: requestBody.email })

        if (isEmailAlredyPresent) {
            return res.status(400).send({ status: false, message: `Email Already Present` });
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
        }
        password = password.trim()
        if (!(password.length >= 8 && password.length <= 15)) {        
            return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
        }
       
        //---------------------------------------Validation Ends-----------------------------------//

        const udatedBody = { title, name, phone, email, password, address }
        let user = await userModel.create(udatedBody)
        let data = await userModel.findOne({ email }).select({ __v: 0 })
        return res.status(201).send({ status: true, message: 'Success', data: data })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }


}

const loginUser = async function (req, res) {


    try {
        let requestBody = req.body;
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please enter login credentials" });
        }

        let { email, password } = requestBody;
        // assignment to consant variable if we give const
        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, msg: "enter an email" });
            return;
        }
        email = email.trim()
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "enter a password" });
            return;
        }
        password = password.trim()
        if (!(password.length >= 8 && password.length <= 15)) {        
            return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
        }
      
        const user = await userModel.findOne({ email: email, password: password }); 

        if (!user) {
            res.status(401).send({ status: false, msg: " Either email or password incorrect" });
            return;
        }

        const token = jwt.sign({
            userId: user._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60
        }, 'project4')


        res.header("x-api-key", token);
        //console.log(moment().format("YYYY-MM-DD"))
        res.status(201).send({ status: true, msg: "successful login",userId:user._id, token: { token } });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

module.exports = {
    registerUser, loginUser
}