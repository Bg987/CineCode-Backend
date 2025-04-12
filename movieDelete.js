const express = require("express");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const db = require("./db");  // Your database connection
const log = require("./log")
const router = express.Router();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
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

    const token = Cookie.split("=")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(400).json({ error: "invalid token" });
    }

    const AdminId = decoded.id;
    const role = decoded.role;

    if (role !== "admin" || AdminId !== "Bg@1234") {
        return res.status(400).json({ error: "unauthorized" });
    }

    const { movieId } = req.body;
    const deleteMovieSql = "DELETE FROM movies WHERE Mid = ?";

    db.query(deleteMovieSql, [movieId], async (err, results) => {
        if (err) {
            console.error("Error deleting movie:", err);
            return res.status(500).json({ message: "Failed to delete movie" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }

        // Attempt to delete from Cloudinary
        const publicId = `CineCode/${movieId}`;
        try {
            const cloudRes = await cloudinary.uploader.destroy(publicId);
            if (cloudRes.result !== "ok" && cloudRes.result !== "not found") {
                console.warn("Cloudinary image delete failed:", cloudRes);
                return res.status(500).json({
                    message: "Movie deleted from database, but failed to delete image from Cloudinary",
                });
            }

            // If everything successful
            const logFilestr = "\nMOVIE DELETE - " + movieId;
            log.logAdmin(logFilestr);
            res.status(200).json({ message: "Movie and Cloudinary image deleted successfully!" });

        } catch (cloudErr) {
            console.error("Cloudinary error:", cloudErr);
            return res.status(500).json({
                message: "Movie deleted from database, but Cloudinary error occurred",
                error: cloudErr.message,
            });
        }
    });
});

module.exports = router;
