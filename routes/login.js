/**
 * Tanner Brown
 * @type {router}
 * Router for handling user to login.
 */


//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../util/utils').db;
let getHash = require('../util/utils').getHash;

var router = express.Router();
let queries = require('../util/queries').MISC_QUERIES;
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/withtoken', (req, res) => {
    let email = req.body['email'];
    let token = req.body['token'];
    let theirPw = req.body['password'];
    if(email && theirPw && token) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT MemberID, Password, Salt FROM Members WHERE Email=$1', [email])
        //If successful, run function passed into .then()
            .then(row => {
                let salt = row['salt'];
                //Retrieve our copy of the password
                let ourSaltedHash = row['password'];

                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                if (wasCorrectPw) {
                    //password and email match. Save the current FB Token
                    let id = row['memberid'];
                    let params = [id, token];
                    db.manyOrNone('INSERT INTO FCM_Token (memberId, token) VALUES ($1, $2) ON CONFLICT (memberId) DO UPDATE SET token=$2;', params)
                        .then(row => {
                            res.send({
                                success: true,
                                message: "Token Saved"
                            });
                        })
                        .catch(err => {
                            console.log("failed on insert");
                            console.log(err);
                            //If anything happened, it wasn't successful
                            res.send({
                                success: false,
                                message: err
                            });
                        })

                } else {
                    res.send({
                        success: false
                    });
                }

            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                res.send({
                    success: false,
                    message: err
                });
            });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});
/**
 * Logs in a user. If the user has a firebasetoken, it stores that in the token db
 * Returns all of the memberID info - except password/salt.
 */
// router.post('/', (req, res) => {
//     let email = req.body['email'];
//     let theirPw = req.body['password'];
//     let token = req.body['token'];
//     let wasSuccessful = false;
//
//     if(email && theirPw) {
//         //Using the 'one' method means that only one row should be returned
//         db.one('SELECT Password, Salt, memberid FROM Members WHERE Email=$1', [email])
//         //If successful, run function passed into .then()
//             .then(row => {
//                 let salt = row['salt'];
//                 //Retrieve our copy of the password
//                 let ourSaltedHash = row['password'];
//
//                 let id = row['memberid'];
//                 //Combined their password with our salt, then hash
//                 let theirSaltedHash = getHash(theirPw, salt);
//
//                 //Did our salted hash match their salted hash?
//                 let wasCorrectPw = ourSaltedHash === theirSaltedHash;
//
//                 console.log("was correct password:" + wasCorrectPw);
//
//                 if(wasCorrectPw) {
//
//                     db.one('SELECT memberid, firstname, lastname, username, email, verification FROM Members WHERE Email=$1', [email])
//                     //if successful
//                         .then((row) => {
//                             res.send({
//                                 success: true,
//                                 userdata:row,
//                                 tokenSaved: isTokenSaved
//                             })
//                         }).catch((err) => {
//                         res.send({
//                             success: true,
//                             userdata: "failed to retrieve",
//                             tokenSaved: isTokenSaved,
//                             error: err
//                         })
//                     });
//
//
//                     console.log("Token before retrieval SHOULD NOT DISPLAY: "+token);
//                     //if no firebase token sent in body, check database.
//                     if(null == token || token == ''){
//                         token = db.one(queries.GET_FB_TOKEM_BY_EMAIL, email)
//                             .then((data) =>{
//                                 console.log("Returned Token:" +data.toString());
//                                 return data;
//
//                             }).catch((err) => { //firebase token wasn't found
//                                 console.log("No returned token. Generating token.");
//
//
//
//                             });
//                     }
//                     console.log("Token after retrieval FINAL TEST SHOULD DISPLAY: "+token);
//
//
//                     console.log("ID:"+id);
//                     let params = [id, token];
//                     let isTokenSaved = false;
//                     console.log("params:" + params);
//                     db.manyOrNone('INSERT INTO FCM_Token (memberId, token) VALUES ($1, $2) ON CONFLICT (memberId) DO UPDATE SET token=$2;', params)
//                         .then(row => {
//                             isTokenSaved = true;
//                         });
//                     //get all user info from DB
//                     db.one('SELECT memberid, firstname, lastname, username, email, verification FROM Members WHERE Email=$1', [email])
//                     //if successful
//                         .then((row) => {
//                             res.send({
//                                 success: true,
//                                 userdata:row,
//                                 tokenSaved: isTokenSaved
//                             })
//                         }).catch((err) => {
//                         res.send({
//                             success: true,
//                             userdata: "failed to retrieve",
//                             tokenSaved: isTokenSaved,
//                             error: err
//                         })
//                     });
//                 } else {
//                     res.send({
//                         success: false
//                     });
//                 }
//             })
//             //More than one row shouldn't be found, since table has constraint on it
//             .catch((err) => {
//                 //If anything happened, it wasn't successful
//                 res.send({
//                     success: false,
//                     message: err
//                 });
//             });
//     } else {
//         res.send({
//             success: false,
//             message: 'missing credentials'
//         });
//     }
// });

router.post('/', (req, res) => {
    let email = req.body['email'];
    let theirPw = req.body['password'];
    let wasSuccessful = false;
    if(email && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT Password, Salt, firstname, lastname, username, memberid FROM Members WHERE Email=$1', [email])
        //If successful, run function passed into .then()
            .then(row => {
                let salt = row['salt'];
                //Retrieve our copy of the password
                let ourSaltedHash = row['password'];

                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                    let firstname = row['firstname'];
                    let lastname = row['lastname'];
                    let id = row['memberid'];
                    let username = row['username'];
                    memberdata = {firstname, lastname, username, id, email};

                //Send whether they had the correct password or not
                res.send({
                    success: wasCorrectPw,
                    user:memberdata
                });
            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                res.send({
                    success: false,
                    message: err
                });
            });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});

module.exports = router;

/*  old queries
'SELECT memberid, firstname, lastname, username, email, verification FROM Members WHERE Email=$1'

 */