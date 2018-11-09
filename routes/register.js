//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../util/utils').db;

let getHash = require('../util/utils').getHash;

let sendVerificationEmail = require('../util/utils').sendVerificationEmail;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());


const saltkey = "bigshoeapple";

router.get('/verify', (req, res) => {
    console.log("verifying new user: "+email);
    if(getHash(saltkey, req.query['email']) === req.query['key']){
        //UPDATE members SET verification = 1 WHERE email = 'test@test.com2';
        let query = `UPDATE members SET verification = 1 WHERE email =$1`;
        db.none(query, req.query['email'])
            .then(() => {
            //We successfully verified the user, let the user know
                console.log("new user verified");
            res.send({
                success: true
            });
        }).catch((err) => {
            //log the error
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false
        });
    }
});

router.post('/resend', (req, res) => {
    var email = req.body['email'];

    sendVerificationEmail(email, getHash(saltkey, email));
});

router.post('/', (req, res) => {
    res.type("application/json");

    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(first && last && username && email && password) {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let params = [first, last, username, email, salted_hash, salt];
        db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6)", params)
            .then(() => {
                //We successfully added the user, let the user know
                res.send({
                    success: true
                });
                sendVerificationEmail(email, getHash(saltkey, email));
            }).catch((err) => {
            //log the error
            console.log(err);
            //If we get an error, it most likely means the account already exists
            //Therefore, let the requester know they tried to create an account that already exists
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

module.exports = router;