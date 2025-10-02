// signup.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const connection = require('./db');
const log = require('./log');
const sgTransport = require("nodemailer-sendgrid");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport(
  sgTransport({
    apiKey: process.env.Mail_API_KEY,
  })
);

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// User registration endpoint (Step 1: Send OTP)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required.' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    const otpId = uuidv4(); // unique ID to track OTP session

    // Store data server-side
    otpStore.set(otpId, {
      username,
      email,
      password,
      otp: hashedOtp,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send OTP to user's email
    transporter.sendMail({
      from: process.env.Email,
      to: email,
      subject: 'CineCode new user sign up OTP',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    }, (error) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error sending OTP.' });
        }
        console.log("store = ", otpStore);
      res.status(201).json({ message: 'OTP sent. Please verify.', otpId }); // send only ID to frontend, not OTP
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'server error', err });
  }
});

// OTP verification (Step 2: Verify & Register User)
router.post('/verify-otp', async (req, res) => {
  const { otp, otpId } = req.body;
    let logdataID, logdataName;
    console.log(req.body);
    if (!otp || !otpId) {
    return res.status(400).json({ message: 'OTP and otpId are required.' });
  }

  const otpSession = otpStore.get(otpId);

  if (!otpSession) {
    return res.status(400).json({ message: 'Session expired or invalid. Please register again.' });
  }

  if (otpSession.expiry < Date.now()) {
    otpStore.delete(otpId);
    return res.status(400).json({ message: 'OTP expired' });
  }

  const isMatch = await bcrypt.compare(otp.toString(), otpSession.otp);
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect OTP.' });
  }

  // OTP valid → create user
  const { username, email, password } = otpSession;
  const userID = uuidv4();

  const sql = 'INSERT INTO userdata (userId, userName, Email, Password) VALUES (?, ?, ?, ?)';
  const userData = [userID, username, email, password];

  connection.query(sql, userData, (err, results) => {
    if (err) {
      return res.status(409).json({ message: 'Email or Username already registered. Please try again.' });
    }

    logdataID = userID;
    logdataName = username;
    const logFilestr = "\nNEW user - " + logdataID + " " + logdataName;
    log.logUser(logFilestr);

    // Clean up session
    otpStore.delete(otpId);
    res.status(200).json({ message: 'User registered successfully!' });
  });
});

module.exports = router;
