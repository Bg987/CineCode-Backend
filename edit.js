const express = require("express");
const db = require("./db");
const secretKey = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const router = express.Router();
router.get("/userReview", async (req, res) => {
    const Cookie = req.headers.cookie;
    if (!Cookie) {
        return res.status(400).json({ error: "Unauthorized user" });
    }
    const token = Cookie.split("=")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const Id = decoded.id;
    const query = `SELECT 
   movies.Mid,
   movies.Mname,
   movies.Year,
   movies.Duration,
   movies.Language,
   movies.Type,
   movies.Discription,
   review.id,
   review.review,
   review.rating
FROM 
   movies
JOIN 
   review ON movies.Mid = review.Mid
   WHERE review.userID = ?`;
    db.query(query, Id, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    })
});
router.post("/editReview", async (req, res) => {
    const Cookie = req.headers.cookie;
    if (!Cookie) {
        return res.status(400).json({ error: "Unauthorized user" });
    }
    const token = Cookie.split("=")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const UId = decoded.id;
    const {Mid,Rid,review,rating}   = req.body;
    if (!Mid || !Rid || !review || !rating) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const query = `UPDATE review SET review = ?, rating = ? WHERE Mid = ? AND id = ? AND userID = ?`;
    db.query(query, [review, rating, Mid, Rid, UId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Review not update" });
        }
        return res.status(200).json({ message: "Review updated successfully" });
    });
})
module.exports = router;
