
const express = require('express')
const User = require('../models/user')
const router = new express.Router()


router.post("/signup", async (req, res) => {
    const user = new User(req.body)
    try {
        if (!req.body.name || !req.body.email || !req.body.password) {
            throw new Error("Please enter all the mandatory details")
        }
        await User.findUser(req.body.email)
        const token = await user.generateAuthToken()
        await user.save()
        res.status(201).send({ user, token })
    }
    catch (e) {
        res.status(400).send({ message: e.message })
    }
})

router.post("/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()//we r calling this meth on user instance bcoz we want to generate token for that
        //specific user
        res.send({ user, token })
    }
    catch (e) {
        console.log(e)
        res.status(400).send({ message: e.message })
    }
})

module.exports = router