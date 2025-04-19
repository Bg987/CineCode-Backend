// signup.js
const express = require('express');
const router = express.Router();

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const connection = require('./db');
const log = require('./log')
const secretKey = process.env.JWT_SECRET;
const mail = process.env.Email;
const pass = process.env.Password;

// Nodemailer configuration for sending OTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail,
        pass: pass,
    }
});

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

// userdata registration endpoint
router.post('/register', (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'userdataname, email, and password are required.' });
        }
        const otp = generateOTP();
        const otpToken = jwt.sign({ username, email, password, otp }, secretKey, { expiresIn: '5m' }); // Token expires in 5 minutes
        // Send OTP to userdata's email
        transporter.sendMail({
            from: mail,
            to: email,
            subject: 'Your OTP Code for Registration',
            text: `Your OTP code is ${otp}. It will expire in 5 minute.`,
        }, (error) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Error sending OTP.' });
            }
            res.status(201).json({ message: 'OTP sent. Please verify.', otpToken }); // Send OTP token to client
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: 'server error', err }); // Send OTP token to client
    }
    
});


router.post('/verify-otp', (req, res) => {
    const { otp, otpToken } = req.body;
    let logdataID, logdataName;
    if (!otp || !otpToken) {
        return res.status(400).json({ message: 'OTP and token are required.' });
    }

    // Verify JWT token and check the OTP
    jwt.verify(otpToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'OTP expired or invalid.' });
        }
        //  console.log('Decoded token data:', decoded); // Debugging: check decoded content
        if (decoded.otp == otp) {
            // Assuming profilePic handling as in your original code
            const { username, email, password } = decoded; // Grab userdata info from decoded token
            const userID = uuidv4();
            // Insert the userdata into the database
            const sql = 'INSERT INTO userdata (userId, userName, Email, Password) VALUES (?, ?, ?, ?)';
            const userData = [userID, username, email, password];
            logdataID = userID;
            logdataName = username;
            connection.query(sql, userData, (err, results) => {
                if (err) {
                    return res.status(409).json({ message: 'Email or Username Already Registered change and again genetate otp' });
                }
                //log files write operation
                const logFilestr = "\nNEW user - " + logdataID + " " + logdataName;
                log.logUser(logFilestr);
                res.status(200).json({ message: 'user registered successfully!' });
            });
        } else {
            res.status(400).json({ message: 'Incorrect OTP.' });
        }
    });
});

module.exports = router;
