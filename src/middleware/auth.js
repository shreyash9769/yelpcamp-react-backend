const jwt = require("jsonwebtoken")
const User = require("../models/user")
const auth = async (req, res, next) => {
    //when the user logs in we r generating a token and sending it to frontend. The frontend then will use this token in headers to 
    //access protected routes
    try {
        const token = req.header("Authorization").replace("Bearer ", "")
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token }) //decoded has _id property bcoz we have used the userId as
        //payload in generateAuthToken() in User model. tokens.token is written in string bcoz That's a special syntax in Mongoose for accessing a property on an array of objects
        if (!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    }
    catch (e) {
        res.status(401).send({ message: "Please Authenticate" })
    }
}

module.exports = auth