const express = require("express");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const app = express();
const db = require("./db"); // Adjust this based on your database connection file
const router = express.Router();
app.use(cookieParser());
router.get("/", async (req, res) => {
    const userCookie = req.headers.cookie;
    if (!userCookie) {
        return res.status(400).json({ error: "unauthorized user" });
    }
    const token = userCookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const role = decoded.role;//admin or user
    if (!role || role != 'user') {
        return res.status(400).json({ error: "bad request" });
    }
    const userId = decoded.id;
    let query = `SELECT * FROM review WHERE userID = ?;`
    db.query(query, userId, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message, message: "Server Error" });
        }
        else if (results.length === 0) {
            return res.status(404).json({ message: "No reviews found for this user." });
        }
        res.json(results);
    })
})
module.exports = router;
