

const express = require("express")
const app = express()
const mongoose = require("mongoose")
const campgroundRoutes = require("./routes/campground")
const userRoutes = require("./routes/user")

//while using env variables first install env-cmd package then change the script in package.json
//alternately you can install dotenv package and use dotenv.config() to use env variables

// mongoose.connect("mongodb://localhost:27017/yelp-camp-react")
mongoose.connect(process.env.MONGODB_URL)

// app.get("/", async (req, res) => {
//     const camp = new Campground({ title: "Hi", description: "fffffffffffffffffffffffffffffffffffffffffffffffffff", location: "Hi", price: 30 });
//     await camp.save();
//     res.send(camp)
// })
app.use(express.json())
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,Authorization")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE")
    next()
})

//this is a middleware which will run before every route. We wrote auth.js in separate file bcoz we dont want that middleware to run for
//every route if we want middleware to run for every route then we write it here. The below middleware will not execute any async func
//bcoz we r not calling next() 
// app.use((req, res, next) => {
//     res.send({ message: "Site is under maintainance please come back later" })
// })
app.use(userRoutes)
app.use(campgroundRoutes)
app.listen(process.env.PORT, () => {
    console.log("Listening")
})