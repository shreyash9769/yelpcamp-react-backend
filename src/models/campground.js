const mongoose = require("mongoose")
const Review = require("./review")
const Schema = mongoose.Schema

const CampgroundSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        minlength: 20
    },
    location: {
        type: String,
        required: true
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        url: String,
        filename: String
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }]
})

//this is for when a campground is deleted the reviews associated with that should also be deleted
CampgroundSchema.post("findOneAndDelete", async (doc) => {//doc is the campground which got deleted
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews //we are basically deleting reviews where the _id field was present in doc.reviews
            }
        })
    }
})

const Campground = mongoose.model("Campground", CampgroundSchema)

module.exports = Campground