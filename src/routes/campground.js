const express = require('express')
const Campground = require('../models/campground')
const multer = require('multer')
const { storage } = require("../cloudinary")
const Review = require('../models/review')
const auth = require('../middleware/auth')
const { default: mongoose } = require('mongoose')
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding")
//const upload = multer({ dest: 'uploads/' })
const upload = multer({ storage }) //here we r telling instead of storing in uploads folder locally store in cloudinary storage obj
//which we created in cloudinary/index.js 
const router = new express.Router()

const geocoder = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN })

router.get("/campgrounds", async (req, res) => {
    try {
        const campgrounds = await Campground.find({})
        res.send(campgrounds)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.get("/campgrounds/:id", async (req, res) => {
    try {
        //ref lect 525 of colt web dev to understd below line
        const campground = await Campground.findOne({ _id: req.params.id }).populate({ path: "reviews", populate: { path: "author" } }).populate("owner")
        if (!campground) {
            throw new Error("Sorry! Campground not Found")
        }
        res.send(campground)

    }
    catch (e) {
        res.status(400).send({ message: e.message })
    }
})

router.post("/campgrounds/new", auth, upload.array("image"), async (req, res) => {
    //console.log(req.body, req.files)
    try {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.location,
            limit: 1
        }).send()
        if (geoData.body.features.length == 0) {
            throw new Error("Could not find the location. Please enter a correct location")
        }
        const campground = new Campground(req.body)
        campground.geometry = geoData.body.features[0].geometry
        campground.owner = req.user._id
        //console.log(req.files) req.files will contain properties such as path,filename,size etc 
        //path contains url of images stored in cloudinary
        campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })) //on this line we storing the path and filename
        //in mongo. We r storing filename as well bcoz in cloudinary it is easy to delete imgs using filename

        await campground.save()
        res.status(201).send(campground)
    }
    catch (e) {
        res.status(400).send({ message: e.message })
    }
})

router.patch("/campground/:id", auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const campground = await Campground.findOne({ _id: req.params.id })
        if (!campground) {
            throw new Error("Sorry! Campground not Found")
        }
        if (!req.body.title || !req.body.description || !req.body.price || !req.body.location) {
            throw new Error("Please enter all mandatory fields")
        }
        if (req.body.description.length <= 20) {
            throw new Error("Description must be more than 20 characters")
        }
        if (req.body.location) {
            const geoData = await geocoder.forwardGeocode({
                query: req.body.location,
                limit: 1
            }).send()
            if (geoData.body.features.length === 0) {
                throw new Error("Could not find the location. Please enter a valid location")
            }
            campground.geometry = geoData.body.features[0].geometry
        }
        updates.forEach(update => campground[update] = req.body[update])
        await campground.save()
        res.send(campground)
    }
    catch (e) {
        res.status(400).send({ message: e.message })
    }
})

router.delete("/campground/:id", auth, async (req, res) => {
    try {
        const campground = await Campground.findOneAndDelete({ _id: req.params.id })
        if (!campground) {
            return res.status(404).send({ message: "Sorry! Campground not Found" })
        }
        res.send(campground)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.post("/campground/:id/review", auth, async (req, res) => {
    try {
        const campground = await Campground.findById(req.params.id)
        if (!req.body.body) {
            throw new Error("Oops! Review cannot be empty")
        }
        const review = new Review(req.body)
        review.author = req.user._id
        campground.reviews.push(review)
        await review.save()
        await campground.save()
        res.send(review)
    }
    catch (e) {
        res.status(400).send({ message: e.message })
    }
})

router.delete("/campground/:id/:reviewId", auth, async (req, res) => {
    try {
        const { id, reviewId } = req.params
        await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
        await Review.findByIdAndDelete(reviewId)
        res.send()
    }
    catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router