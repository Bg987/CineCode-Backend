const express = require('express');
const router = express.Router();
const connection = require('./db');
const fs = require("fs");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const log = require('./log');
//MFApprovence- movies for approvence
router.get("/MFApprovence", (req, res) => {
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
    const sql = 'SELECT * FROM movies WHERE Approved = ?';
    connection.query(sql, [false], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No Movies For Approvance' });
        }
        else {
            res.json(results);
        }
    });
})
///AOrD - approve or disapprove
router.post("/AOrD", (req, res) => {
    const { movieId, status } = req.body;

    if (status === -1) {
        // Delete the movie if status is -1
        const deleteSql = "DELETE FROM movies WHERE Mid = ?";
        const filePath = `C:/Users/HP/SE/data/movies/${movieId}.jpg`; 
        connection.query(deleteSql, [movieId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error deleting movie" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Movie not found" });
            }
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return res.status(500).json({ message: "Failed to delete movie file" });
                    }
                    res.status(200).json({ message: "Movie and file deleted successfully!" });
                });
            } else {
                console.log(`No file found for movieId: ${movieId}`);
                res.status(200).json({ message: "Movie deleted successfully, but no file found." });
            }
        });
    } else {
        // Update status for approve
        const updateSql = "UPDATE movies SET Approved = ? WHERE Mid = ?";
        connection.query(updateSql, [status, movieId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error updating movie status" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Movie not found" });
            }
            return res.status(200).json({ message: "Movie approved" });
        });
    }
});

module.exports = router;
