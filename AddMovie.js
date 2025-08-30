const express = require("express");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("./db"); 
const log = require("./log");
const router = express.Router();

require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const secretKey = process.env.JWT_SECRET;

router.post("/AddMovie", async (req, res) => {
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
    const role = decoded.role;
    let bool, by;

    if (role === "admin") {
        bool = true;
        by = "Admin";
    } else if (role === "user") {
        bool = false;
        by = Id;
    } else {
        return res.status(400).json({ error: "Bad request" });
    }

    const movieData = {
        movieName: req.body.name,
        releaseYear: req.body.releaseYear,
        language: req.body.language,
        type: JSON.parse(req.body.type),
        description: req.body.description,
        duration: req.body.duration,
    };
    if (!movieData.movieName || !movieData.releaseYear || !movieData.language || !movieData.type || !movieData.description || !movieData.duration || !req.files || !req.files.movieImage) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const MiD = uuidv4();

    try {
        const sql = `INSERT INTO movies (Mid, Mname, Language, Year, Type, Discription, Duration, Approved, \`By\`) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            MiD,
            movieData.movieName,
            movieData.language,
            movieData.releaseYear,
            JSON.stringify(movieData.type),
            movieData.description,
            movieData.duration,
            bool,
            by,
        ];

        db.query(sql, values, async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Movie already registered or DB error" });
            }

            if (req.files && req.files.movieImage) {
                const movieImage = req.files.movieImage;

                try {
                    // Compress and convert to webp
                    const compressedImageBuffer = await sharp(movieImage.data)
                        .resize(800)
                        .webp({ quality: 50 })
                        .toBuffer();

                    // Upload to Cloudinary
                    const imageUrl = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                folder: "CineCode",
                                public_id: MiD,
                                resource_type: "image"
                            },
                            (error, result) => {
                                if (error) return reject(error);
                                resolve(result.secure_url);
                            }
                        ).end(compressedImageBuffer);
                    });

                    const logFilestr = `\nMOVIE ADD - ${MiD} ${movieData.movieName} ${movieData.language} By ${by}`;
                    if (role === "admin") {
                        log.logAdmin(logFilestr);
                        return res.status(201).json({
                            message: "Movie details saved successfully",
                            imageUrl,
                        });
                    } else if (role === "user") {
                        log.logUser(logFilestr);
                        return res.status(201).json({
                            message: "Movie details sent to Admin for approval",
                            imageUrl,
                        });
                    } else {
                        return res.status(500).json({ message: "Internal server error" });
                    }

                } catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                    return res.status(500).json({ message: "Failed to upload movie image" });
                }

            } else {
                return res.status(400).json({ message: "No image file provided" });
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Failed to save movie details" });
    }
});

module.exports = router;
