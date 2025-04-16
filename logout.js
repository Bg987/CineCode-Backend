const express = require("express");
const log = require("./log");
const router = express.Router();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const prod = process.env.NODE_ENV === 'production';
const connection = require('./db'); // Database connection
const app = express();

router.get("/logoutUser", async (req, res) => {
    const userCookie = req.headers.cookie;
    if (!userCookie) {
        return res.status(400).json({ error: "User Error: No cookie found" });
    }

    const token = userCookie.split('=')[1];

    try {
        const decoded = jwt.verify(token, secretKey);
        const userId = decoded.id;
        // Remove user from activeu table
        const deleteQuery = 'DELETE FROM activeu WHERE userID = ?';
        connection.query(deleteQuery, [userId], async (err, results) => {
            if (err) {
                console.log("Database error:", err);
                return res.status(500).json({ message: 'Server error' });
            }
            // Log the user logout
            const logFilestr = "\nLOGOUT - " + userId;
            log.logUser(logFilestr);
            if (!prod) {
                //for test
                res.clearCookie('token');
            }
            else {//for production
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: true, // Ensure it's true if using HTTPS
                    sameSite: "None" // Important for cross-origin requests
                });
            }
            res.status(200).send("Logout successful");
        });
    } catch (err) {
        console.log("JWT verification error:", err);
        res.status(401).send("Invalid or expired token");
    }
});

router.get("/logoutAdmin", (req, res) => {
    try {
        const logFilestr = "\nLOGOUT - ";
        if (!prod) {
            //for test
            res.clearCookie('token');
        }
        else {//for production
            res.clearCookie("token", {
                httpOnly: true,
                secure: true, // Ensure it's true if using HTTPS
                sameSite: "None" // Important for cross-origin requests
            });
        }
        log.logAdmin(logFilestr);
        res.status(200).json("ok");
    }
    catch (err) {
        console.log("error ", err);
        res.status(500).send("server error");
    }
});
module.exports = router;
