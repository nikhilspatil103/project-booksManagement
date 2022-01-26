const jwt = require('jsonwebtoken')


const userAuth = async (req, res, next) => {
    try {
        const token = req.header('x-api-key')
      
        if (!token) {
            return res.status(403).send({ status: false, message: `Missing authentication token in request` })

        }

        //Decode Token to extract Time
        let timeOut = jwt.decode(token,'project4')
        
       
        
        //let timeOut = jwt.verify(token, 'project4')
        
        if (!timeOut) {
            return res.status(403).send({ status: false, message: `Invalid authentication token in request ` })
        }
        //compare expiry time with current time
        if (Date.now() > (timeOut.exp)*1000 ){
            return res.status(404).send({ status: false, message: `Session Expired, please login again` })
        }



        req.userId = timeOut.userId

        next()
    } catch (error) {
        console.error(`Error! ${error.message}`)
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = {
    userAuth
}