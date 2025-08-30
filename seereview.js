const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const db = require("./db"); // Adjust this based on your database connection file
const log = require("./log");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const router = express.Router();
app.use(cookieParser());
router.get("/seeR", async (req, res) => {
    const userCookie = req.headers.cookie;
    if(!userCookie){
        return res.status(400).json({ error : "unauthorized user" });
    }
    const token = userCookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const role = decoded.role;//admin or user
    if (!role||role != 'user') {
        return res.status(400).json({ error: "bad request" });
    }
    let search;
    let query = `
    SELECT 
   movies.Mid,
   movies.Mname,
   movies.Year,
   movies.Duration,
   movies.Language,
   movies.Type,
   movies.Discription,
   review.userID,
   review.review,
   review.rating
FROM 
   movies
JOIN 
   review ON movies.Mid = review.Mid   `;
    if (req.query.name) {
        search = req.query.name;
        query += " WHERE movies.Mname =  ? ";
    }
    query += "ORDER BY movies.Mname;";
    //console.log(req.query.nam);
    db.query(query, search, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }

        // Group movies using a map
        const movieMap = new Map();
        // Helper function to fetch username
        const getUsername = (userID) => {
            return new Promise((resolve, reject) => {
                const sql = "SELECT username FROM userdata WHERE userID = ?";
                db.query(sql, [userID], (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(results[0]?.username || "Unknown");
                });
            });
        };

        // Process results and fetch usernames
        const promises = results.map(async ({ Mid, Mname, Year, userID, Discription, Duration, review, Language, Type, rating }) => {
            if (!movieMap.has(Mid)) {
                movieMap.set(Mid, {
                    Mid,
                    Mname,
                    Year,
                    Language,
                    Type,
                    Duration,
                    Discription,
                    review: []
                });
            }

            const username = await getUsername(userID); // Fetch username asynchronously
            movieMap.get(Mid).review.push({ userID, username, review, rating }); // Include username in the review object
        });

        try {
            await Promise.all(promises); // Wait for all usernames to be fetched
            const movies = Array.from(movieMap.values()); // Convert map to array
            res.json(movies); // Send the final array as a response
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});
router.get("/seeR/id", async (req, res) => {
    const userCookie = req.headers.cookie;
    if(!userCookie){
        return res.status(400).json({ error : "unauthorized user" });
    }
    const token = userCookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const role = decoded.role;//admin or user
    if (!role||role != 'user') {
        return res.status(400).json({ error: "bad request" });
    }
    const {id} = req.query;
    let query = 'SELECT * FROM review WHERE Mid = ?';
    if(!id){
        return res.status(400).json({ error: "Movie ID is required." });
    }
    db.query(query, id, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "No reviews found for this movie." });
        }
        else{
            return res.status(200).json(results);
        }
    })
})

module.exports = router;
