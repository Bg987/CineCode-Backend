const express = require("express");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const db = require("./db"); // Adjust this based on your database connection file
const router = express.Router();
const log = require("./log");

router.post("/AddMovie", async (req, res) => {
    //console.log(req.body);
    let bool, by;
    if (!req.body.AOrU) {
        res.status(500).json({ message: "error contact developer" });
    }
    //condition for admin enter movie
    if (req.body.AOrU === 'Bg@1234') {
        bool = true;//approved true in database
        by = "Admin";
    }
    //if user enter movie details
    else {
        bool = false;
        const userCookie = req.headers.cookie;
        if (!userCookie) {
            return res.status(400).json({ error: "unauthorized user" });
        }
        const token = userCookie.split('=')[1];
        const decoded = jwt.verify(token, secretKey);
        by = decoded.id;
    }
    const movieData = {
        movieName: req.body.name,
        releaseYear: req.body.releaseYear,
        language: req.body.language,
        type: JSON.parse(req.body.type),
        description: req.body.description,
        duration: req.body.duration,
    };
    const MiD = uuidv4();
    let imagePath = "";
    try {
        // Insert movie details into the database
        const sql = `INSERT INTO movies (Mid, Mname, Language, Year, Type, Discription, Duration, Approved, \`By\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ; `;
        const values = [
            MiD,
            movieData.movieName,
            movieData.language,
            movieData.releaseYear,
            JSON.stringify(movieData.type),
            movieData.description,
            movieData.duration,
            bool,//if admin true else false
            by,//Admin or userid
        ];
        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Movie already registered' });
            }

            // Check if file exists in the request
            if (req.files && req.files.movieImage) {
                const movieImage = req.files.movieImage;
                const fileExtension = path.extname(movieImage.name);
                const fileName = MiD + fileExtension;
                imagePath = path.join("data/movies", fileName);
                const fullPath = path.resolve(__dirname, "../", imagePath);
                // Save the file
                movieImage.mv(fullPath, (err) => {
                    if (err) {
                        //               console.error("File save error:", err);
                        return res.status(500).json({ message: "Failed to save movie image" });
                    }
                    const logFilestr = "\nMOVIE ADD - " + values[0] + " " + values[1] + " " + values[2] + " By " + by;
                    //  dash.emitDashboardData();
                    if (by === "Admin") {
                        log.logAdmin(logFilestr);
                        res.status(201).json({ message: "Movie details saved succesfully " });
                    }
                    else {
                        log.logUser(logFilestr);
                        res.status(201).json({ message: "Movie details send Admin For Approvance" });
                    }
                });
            } else {
                res.status(400).json({ message: "No image file provided" });
            }
        });
    } catch (error) {
        //console.error("Database error:", error);
        res.status(500).json({ message: "Failed to save movie details" });
    }
});

module.exports = router;
