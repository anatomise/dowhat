//import express and set port to 3000
import express from "express";
const app = express();
const port = 3000;
//set view engine to ejs
app.set('view engine', 'ejs');

//import express-validator
import { check, validationResult } from 'express-validator';

//import body parser
import bodyParser from "body-parser";
//use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//set up database
import mongoose from "mongoose";

//define database url
mongoose.connect("mongodb+srv://xugeraldine:iCBoex8EIpw66XiT@techup.skdlpeo.mongodb.net/events")

//define schema - would have done this in separate js file but it kept breaking
const eventSchema = {
 name: String,
 location: String,
 start: Date,
 end: Date,
 tags: [String],
 comments: [{}]
}

const Event = mongoose.model("Event", eventSchema);

//start google maps
//import googlemapsclient
import {Client} from "@googlemaps/google-maps-services-js";
const client = new Client({});


//index page
app.get("/", (req, res) => {
    res.render("pages/index")
});

//event submission page
app.get("/lubang", (req, res) => {
    res.render("pages/lubang")
});

//submit form info, ensure input is sanitised and check for whitespace entries *to add validation check that start date < end date*
app.post("/submit", [
    check('name').trim().escape().notEmpty().withMessage('must not be blank'), 
    check('location').trim().escape().notEmpty().withMessage('must not be blank'),],
(req, res) => {
let { name, location, start, end, tags } = req.body;
let newEvent = new Event({
    name: req.body.name,
    location: req.body.location,
    start: req.body.start,
    end: req.body.end,
    tags: req.body.tags,
});

//handle request only if no errors
const errors = validationResult(req);
//console.log(errors);
if (errors.isEmpty()) { //save, acknowledge submission, and show input
    newEvent.save(); 
    return res.render("pages/thanks", { name, location, start, end, tags })};
//otherwise, show error
return res.render("pages/error");
});

//event listing page
  app.get("/events", async (req, res) => {
    const events = await Event.find({});
    res.render('pages/events', {
        eventsList: events
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`); //check that port is open
  });