require('dotenv').config();
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const http = require("http");
const https = require("https");


const app = express();
const server = http.createServer(app);
const PORT = 4000;

const url = process.env.NODE_ENV === 'production'
    ? "https://cine-code-frontend.vercel.app"
    : "http://localhost:5100";

// async function ping() {
//     setInterval(() => {
//         https.get("https://cinecode-backend-ycz5.onrender.com/test", (res) => {
//             console.log(`Pinged. Status code: ${res.statusCode}`);
//         }).on("error", (e) => {
//             console.error(`Ping failed: ${e.message}`);
//         });
//     },11*60*1000); // every 11 minutes

// }

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

// Routes that impact real-time dashboard
app.use('/apiLogin', emitAfterResponse, loginRoute);
app.use('/apiLogOut', emitAfterResponse, logout);
app.use('/apiSignup', emitAfterResponse, signupRouter);
app.use('/apifAndD', emitAfterResponse, FetchAndDelete);
app.use('/ApiApprove', emitAfterResponse, approve);
app.use('/apiMovie', emitAfterResponse, AddMovie);
// Routes that don’t need emit
app.use('/apiSeeM', SeeMovies);
app.use('/apiSeeR', seeR);
app.use('/apiUserReview', userReview);
app.use('/apiForget', forgotPassword);
app.use('/apiEdit', edit);
app.use('/apiAddR', AddReview);
app.get("/test",(req,res)=>{
    res.status(200).json("ok");
})
// 404 fallback
app.use((req, res) => {
    res.status(404).json('404: Resource Not Found');
});

// Server start
server.listen(PORT, () => {
    //ping();
    console.log(`Server is running on port ${PORT} and ping done`);
});
