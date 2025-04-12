require('dotenv').config();
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const app = express();
const http = require('http');


const server = http.createServer(app);
const PORT = 4000;

// Importing routes and dashboard functionality
require('./dashboard')(server)
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
const { emitDashboardData } = require('./dashboard')(server);
app.use(cors({
    origin: "https://cine-code-frontend.vercel.app/", // Frontend URL AND change in dashboard.js
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use(fileUpload()); //file upload handling
//app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files

app.use('/apiSeeM', SeeMovies);
app.use('/apiAddR', AddReview);
app.use('/apiSeeR', seeR);
app.use('/apiUserReview', userReview);
app.use('/apiForget', forgotPassword);
app.use('/apiLogin' ,loginRoute);
app.use('/apiLogOut', logout);
app.use((req, res, next) => {
    next();// Call emitDashboardData before the route is processed routes given below modify user real time dashboard
    emitDashboardData(); // Pass control to the next middleware 
});
//routers which can change realtime dashboard data

app.use('/apiSignup', signupRouter);
app.use('/apiMovie', AddMovie);
app.use('/apifAndD', FetchAndDelete);
app.use('/ApiApprove', approve);

// app.get("/x",(req,res)=>{
//     const userCookie = req.headers.cookie;
//         if (!userCookie) {
//             return res.status(400).json({message :"unauthorized user"});
//         }
// })
// 404 Error handler for unmatched routes
app.use((req, res) => {
    res.status(404).json('404: Resource Not Found');
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on`);
});
