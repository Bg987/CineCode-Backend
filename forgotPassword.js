const express = require("express");
require("dotenv").config(); // Load environment variables
const router = express.Router();
const nodemailer = require("nodemailer");
const connection = require("./db"); // Database connection
const log = require("./log")
// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // Replace with your email service, e.g., "gmail"
    auth: {
        user: process.env.Email,
        pass: process.env.Password
    }
});
router.post("/forgetPassword", (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: "username is required." });
    }

    const sql = "SELECT * FROM userdata WHERE userName = ?";
    connection.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "An error occurred. Please try again." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "username not found." });
        }
        if (results.length == 1) {
            //console.log(results[0]);
            const userdata = results[0];
            const mailOptions = {
                from: process.env.Email,
                to: userdata.Email,
                subject: "Cinecode Password Recovery",
                text: `Dear ${username},\n\nYour password is: ${userdata.Password}\n\nPlease keep it secure.`
            };
            try {
                await transporter.sendMail(mailOptions);
                const logFilestr = "FORGOT PASSWORD - " + userdata.userdataID + " " + userdata.userdataname;
                log.logUser(logFilestr);
                res.status(200).json({ message: 'Password has been sent to your email.' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Failed to send email. Please try again." });
            }
        }
        else{
            res.status(400).json({ message: "Database Error"});
        }
    });
});

module.exports = router;
/*


*/ 