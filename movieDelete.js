const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const db = require("./db");  // Your database connection
const log = require("./log")
const router = express.Router();
// Fetch all movies from the database
router.get("/getMovies", (req, res) => {
    const Cookie = req.headers.cookie;
    if (!Cookie) {
        return res.status(400).json({ error: "unauthorized user" });
    }
    const token = Cookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const AdminId = decoded.id;
    const role = decoded.role;
    if (role !== 'admin' || AdminId !== 'Bg@1234') {
        return res.status(400).json({ error: "unauthorized" });
    }
    const sql = "SELECT * FROM movies WHERE Approved = ? ORDER BY Mname";
    db.query(sql, [1], (err, results) => {
        if (err) {
            // console.error("Error fetching movies:", err);
            return res.status(500).json({ message: "Failed to fetch movies" });
        }
        //console.log(results);
        res.json(results);  // Send the movie data as JSON
    });
});
// Delete a movie by ID
router.delete("/deleteMovie", (req, res) => {
    const Cookie = req.headers.cookie;
    if (!Cookie) {
        return res.status(400).json({ error: "unauthorized user" });
    }
    const token = Cookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const AdminId = decoded.id;
    const role = decoded.role;
    if (role !== 'admin' || AdminId !== 'Bg@1234') {
        return res.status(400).json({ error: "unauthorized" });
    }
    const { movieId } = req.body;
    const filePath = `C:/Users/HP/SE/data/movies/${movieId}.jpg`;
    const deleteMovieSql = "DELETE FROM movies WHERE Mid = ? ";
    db.query(deleteMovieSql, [movieId], (err, results) => {
        if (err) {
            console.error("Error deleting movie:", err);
            return res.status(500).json({ message: "Failed to delete movie" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        // Step 2: Delete the file associated with the movieId from the filesystem
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    //console.error("Error deleting movie file:", err);
                    return res.status(500).json({ message: "Failed to delete movie file" });
                }
                // console.log(`File ${filePath} deleted successfully.`);
                const logFilestr = "\nMOVIE DELETE - " + movieId;
                log.logAdmin(logFilestr);
                res.status(200).json({ message: "Movie and file deleted successfully!" });
            });
        } else {
            res.status(200).json({ message: "Movie deleted successfully, but no file found." });
        }
    });
});
module.exports = router;
