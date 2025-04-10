const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const connection = require("./db"); // Database connection
const log = require("./log");

const secretKey = process.env.JWT_SECRET;

// Middleware
router.use(express.json());
router.use(cookieParser());

// Single Login Route
router.post("/login", (req, res) => {
    const { Username, password, role } = req.body;
    if (!Username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }
    if (role === "admin") {
        const adminQuery = "SELECT * FROM admindata WHERE AdminId = ?";
        connection.query(adminQuery, [Username], (err, adminResults) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Server error" });
            }

            if (adminResults.length > 0) {
                const admin = adminResults[0];

                if (password !== admin.AdminPass) {
                    return res.status(400).json({ message: "Admin Invalid password." });
                }

                // Generate admin token
                const token = jwt.sign({ id: admin.AdminId, role: "admin" }, secretKey, { expiresIn: "1000h" });

                res.cookie("token", token, {
                    httpOnly: true,
                    maxAge: 3600 * 1000*240000000,
                    secure: false, // Set true for production (HTTPS required)
                });

                log.logAdmin(`\nLOGIN - `);

                return res.status(200).json({ message: "Admin login successful!", token, role: "admin" });
            }
        });
    }
    else {
        // If not an admin, check in userdata table
        const userQuery = "SELECT * FROM userdata WHERE userName = ?";
        connection.query(userQuery, [Username], (err, userResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Server error" });
            }

            if (userResults.length === 0) {
                return res.status(400).json({ message: "User not found." });
            }

            const user = userResults[0];

            if (password !== user.Password) {
                return res.status(400).json({ message: "Invalid password." });
            }

            // Check if user is already logged in
            const checkActiveQuery = "SELECT * FROM activeu WHERE userID = ?";
            connection.query(checkActiveQuery, [user.userID], (err, activeResults) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: "Server error" });
                }

                if (activeResults.length > 0) {
                    return res.status(400).json({ message: "User already logged in elsewhere." });
                }

                // Insert userID into activeu table
                const insertActiveQuery = "INSERT INTO activeu (userID) VALUES (?)";
                connection.query(insertActiveQuery, [user.userID], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: "Server error" });
                    }

                    // Generate user token
                    const token = jwt.sign({ id: user.userID, role: "user" }, secretKey, { expiresIn: "1000h" });

                    log.logUser(`\nLOGIN - ${user.userID}`);

                    res.cookie("token", token, {
                        httpOnly: true,
                        maxAge: 240000 * 60 * 60 * 1000, 
                        secure: false, // Set true for production (HTTPS required)
                    });

                    return res.status(200).json({ message: "User login successful!", token, role: "user" });
                });
            });
        });
    }
});

module.exports = router;
