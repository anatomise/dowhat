//import express and set port to 3000
import express from "express";
const app = express();
const port = 3000;
import axios from "axios";
//set view engine to ejs
app.set('view engine', 'ejs');
import dotenv from 'dotenv';
dotenv.config();

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
mongoose.connect(`mongodb+srv://xugeraldine:iCBoex8EIpw66XiT@techup.skdlpeo.mongodb.net/events`);

//define database schema 
const eventSchema = {
    name: String,
    location: String,
    start: Date,
    end: Date,
    tags: [String],
    comments: [{}],
    googlePlaceId: String 
  };

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
let { name, location, start, end, tags, googlePlaceId} = req.body;
let newEvent = new Event({
    name: req.body.name,
    location: req.body.location,
    start: req.body.start,
    end: req.body.end,
    tags: req.body.tags,
    googlePlaceId: req.body.googlePlaceId,    
});

//handle request only if no errors
const errors = validationResult(req);
//console.log(errors);
if (errors.isEmpty()) { //save, acknowledge submission, and show input
    newEvent.save(); 
    return res.render("pages/thanks", { name, location, start, end, tags, googlePlaceId })};
//otherwise, show error
return res.render("pages/error");
});

//event listing page
//return events only after current date
    const targetDate = new Date().toJSON();
    console.log(targetDate);
    app.get("/events", async (req, res) => {
    const events = await Event.find({start: { $gt: targetDate }})
                                    .sort({ start: 1 });
//format date to be more human readable
const formattedEvents = events.map(event => {
    const formattedEvent = {
        ...event._doc,
        start: event.start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
            event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        tags: event.tags.join(', ')
    };

// if there is no end date
    if (event.end) {
        formattedEvent.end = event.end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
            event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    return formattedEvent;
});
//render page
       res.render('pages/events', {
        eventsList: formattedEvents
    });
});

//get events from MongoDB
app.get("/events-data", async (req, res) => {
    try {
        const dbevents = await Event.find();
        res.json(dbevents);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Add a new endpoint for place details proxy
app.get("/place-details", async (req, res) => {
    const { place_id } = req.query;

    try {
        const placeDetailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=AIzaSyAmxDo1bfDzW85IjuiwzbhDyr7Cs1ImeSA`
        );

     //   console.log("Place Details Response:", placeDetailsResponse.data);

        res.json(placeDetailsResponse.data);
    } catch (error) {
        console.error("Error fetching place details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`); //check that port is open
  });