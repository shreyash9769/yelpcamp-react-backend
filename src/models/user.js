const mongoose = require("mongoose")
const validator = require('validator')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Schema = mongoose.Schema

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    tokens: [{
        token: {  //we r storing token as well in db so that user can then login from various devices so the tokens created with diff devices will be stored here
            type: String
        }
    }]
})

UserSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

UserSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

UserSchema.statics.findUser = async (email) => {
    const user = await User.findOne({ email })
    if (user) {
        throw new Error("Your email is already registered with us. Please login instead")
    }
    return user
}

UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("Invalid Credentials")
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Invalid Credentials")
    }
    return user
}

UserSchema.pre("save", async function (next) { //we have used std func bcoz of this keywork,arrow func do not bind this
    const user = this
    if (user.isModified("password")) { //this will be true when the user is first created and when the password is modified
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() //next is called so that mongoose will know that we have completed the pre work
})

const User = mongoose.model("User", UserSchema)

module.exports = User