require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = 4000;

const url = process.env.NODE_ENV === 'production'
    ? "https://cine-code-frontend.vercel.app"
    : "http://192.168.111.47:5100";

// Initialize dashboard/socket
const { emitDashboardData } = require('./dashboard')(server);

// Middleware to emit after response
function emitAfterResponse(req, res, next) {
    const originalSend = res.send;
    res.send = function (body) {
        res.send = originalSend; // Restore original
        res.send(body);          // Send response
        emitDashboardData();     // Emit after sending
    };
    next();
}

// Import routes
const signupRouter = require('./signup');
const loginRoute = require("./login");
const forgotPassword = require("./forgotPassword");
const AddMovie = require("./AddMovie");
const AddReview = require("./AddReview");
const FetchAndDelete = require("./movieDelete");
const SeeMovies = require("./SeeMovies");
const seeR = require("./seereview");
const userReview = require("./userReview");
const logout = require("./logout");
const approve = require("./approve");
const edit = require("./edit");

// Middlewares
app.use(cors({
    origin: url,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json());
app.use(fileUpload());

// Routes that don’t impact real-time dashboard
app.use('/apiLogin',emitAfterResponse, loginRoute);
app.use('/apiLogOut',emitAfterResponse, logout);
app.use('/apiSignup',emitAfterResponse, signupRouter);
app.use('/apifAndD', emitAfterResponse, FetchAndDelete);
app.use('/ApiApprove', emitAfterResponse,approve);
// Routes that don’t need emit
app.use('/apiSeeM', SeeMovies);
app.use('/apiSeeR', seeR);
app.use('/apiUserReview', userReview);
app.use('/apiForget', forgotPassword);
app.use('/apiMovie',  AddMovie);
app.use('/apiEdit', edit);
app.use('/apiAddR',AddReview);

// 404 fallback
app.use((req, res) => {
    res.status(404).json('404: Resource Not Found');
});

// Server start
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("OS:", os.type());
    console.log("Platform:", os.platform());
    console.log("Release:", os.release());
    console.log("Architecture:", os.arch());
    console.log("Total Memory:", os.totalmem() / (1024 * 1024));
    console.log("Free Memory:", os.freemem() / (1024 * 1024));
    console.log("Uptime (min):", os.uptime() / 60);
    console.log("User Info:", os.userInfo());
    console.log("Network Interfaces:", os.networkInterfaces());
});
