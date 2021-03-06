/*
    Util file. Holds various necessary helper functions.
*/

//Get the connection to Heroku Database
let db = require('./sql_conn.js');

var nodemailer = require('nodemailer');

//We use this create the SHA256 hash
const crypto = require("crypto");



/**
    Sends an email to a user. Used as a wrapper for sending verification email.
*/
function sendEmail(from, receiver, subj, message) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hoolichat.authenticator@gmail.com',
            pass: 'piedpiper' //YOLO      (burner email I don't care).
        }
    });
    var mailOptions = {
        from: 'hoolichat.authenticator@gmail.com',
        to: receiver,
        subject: subj,
        html: message
    };
    console.log("email from: " + mailOptions.from);
    console.log("email to:" + mailOptions.to);
    // console.log("login: " + transporter.user.toString() );
    // console.log("password: "+transporter.auth.pass.toString());

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

    //fake sending an email for now. Post a message to logs.

}
/**
    Prepares a verification email to send to a user to veifiy account.
*/
function sendVerificationEmail(reciever, key){
    let url="https://tcss450group6-backend.herokuapp.com/register/verify?key="+ key +"&email=" +reciever;
    let message = "<strong>Welcome to our app!</strong> <p>Please follow the link below to verify your account!</p> <p>" + url + "</p>";
    sendEmail("", reciever, "Welcome to Hoolichat! Verification Required!", message);
}

/**
    Prepares a recovery email to the user to recover the user's password.
*/
function sendRecoveryEmail(reciever, code){
     let message = "<p>You requested to change your password</p> <p>Please copy the following code into the Hooli Chat app to change your password.</p> <h2><strong>" + code + "</strong></h2>";
     sendEmail("hoolichat.authenticator@gmail.com", reciever, "Password Recovery", message )
}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}
let queries = require('./queries.js').queries;
let admin = require('./firebase_services.js').admin;
let fcm_functions = require('./firebase_services.js').fcm_functions;
module.exports = {
    db, getHash, sendEmail,sendVerificationEmail, admin, fcm_functions, sendRecoveryEmail
};