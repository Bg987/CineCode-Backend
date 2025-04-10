const express = require("express");
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const db = require("./db"); // Adjust this based on your database connection file
const log = require("./log");
const router = express.Router();

router.post("/AddR", async (req, res) => {
    const userCookie = req.headers.cookie;
    if(!userCookie){
        return res.status(400).json({ error : "unauthorized user" });
    }
    const token = userCookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    
    const reviewData = {
        uid: decoded.id,
        mid: req.body.Mid,
        review: req.body.review,
        rating: req.body.rating,
        Mname: req.body.Mname
    };
    const reviewID = uuidv4();
    try {
        // Insert movie details into the database
        const sql = `INSERT INTO review (id, userID, Mid,Mname, review, rating) VALUES (?, ?,? ,?, ?, ?)`;
        const values = [
            reviewID,
            reviewData.uid,
            reviewData.mid,
            reviewData.Mname,
            reviewData.review,
            reviewData.rating,
        ];
        try {
            db.query(sql, values, (err, results) => {
                if (err) {
                    return res.status(400).json({ message: 'You Already Give Review' });
                }
                const logFilestr = "ADD REVIEW - " + values[0] + " By " + values[1] + " " + values[2];
                log.logUser(logFilestr);
                return res.status(201).json({ message: "Review saved successfully!" });
            });
        }
        catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ message: "Failed to save Review details" });
        }
    }
    catch (err) {
        console.error("error " + err);
    }
});

module.exports = router;
