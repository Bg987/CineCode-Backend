const express = require('express');
const router = express.Router();
const connection = require('./db');
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const secretKey = process.env.JWT_SECRET;
const log = require('./log');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const transporter = nodemailer.createTransport({
    service: "gmail", // Replace with your email service, e.g., "gmail"
    auth: {
        user: process.env.Email,
        pass: process.env.Password
    }
});
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
    const Cookie = req.headers.cookie;
    if (!Cookie) {
        return res.status(400).json({ error: "unauthorized user" });
    }
    const token = Cookie.split('=')[1];
    const decoded = jwt.verify(token, secretKey);
    const Id = decoded.id;
    const role = decoded.role;
    if (role !== 'admin' || Id !== 'Bg@1234') {
        return res.status(400).json({ error: "unauthorized" });
    }
    const { movieId, status } = req.body;
    if (status === -1) {
        // Delete the movie if status is -1
        const deleteSql = "DELETE FROM movies WHERE Mid = ?";
        connection.query(deleteSql, [movieId], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error deleting movie" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Movie not found" });
            }
            const publicId = `CineCode/${movieId}`;
            const id = movieId;
            try {
                const cloudRes = await cloudinary.uploader.destroy(publicId);
                if (cloudRes.result !== "ok" && cloudRes.result !== "not found") {
                    console.warn("Cloudinary image delete failed:", cloudRes);
                    return res.status(500).json({
                        message: "Movie deleted from database, but failed to delete image from Cloudinary",
                    });
                }
                console.log(movieId);
                await mail(movieId, status);
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
    } else {
        // Update status for approve
        const updateSql = "UPDATE movies SET Approved = ? WHERE Mid = ?";
        connection.query(updateSql, [status, movieId], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error updating movie status" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Movie not found" });
            }
            console.log(movieId);
            await mail(movieId, status);
            return res.status(200).json({ message: "Movie approved" });
        });
    }
});

async function mail(Mid, status) {
    try {
        const movieResults = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM movies WHERE Mid = ?";
            connection.query(query, [Mid], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error("Movie not found"));
                resolve(results);
            });
        });
        const movieData = movieResults[0];
        const userResults = await new Promise((resolve, reject) => {
            const sql = "SELECT * FROM userdata WHERE userID = ?";
            connection.query(sql, [movieData.By], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error("User not found"));
                resolve(results);
            });
        });
        const userdata = userResults[0];
        const mailOptions = {
            from: process.env.Email,
            to: userdata.Email,
            subject: "Movie Approval Status",
            text: `Dear ${userdata.userName},

Your movie submission has been ${status === 1 ? 'approved' : 'disapproved'}.

Movie Details:
- Title: ${movieData.Mname}
- Language: ${movieData.Language}
- Release Year: ${movieData.Year}
- Description: ${movieData.Discription}

Best regards,
CineCode Team`,
        };

        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return reject(error);
                resolve();
            });
        });

    } catch (error) {
        console.error("Error in mail function:", error.message);
        throw error; // optional: rethrow if you want to handle this in the caller
    }
}

module.exports = router;
