# 🎬 CineCode Backend

The **CineCode Backend** is a Node.js-powered REST API for managing movies, user reviews, and admin operations. It uses Express.js for the backend server and MySQL for data persistence. Ideal for movie-related platforms requiring review, approval, and authentication features.

---

## 🚀 Features

- 🔐 User Authentication (Login, Logout, Password Recovery) and Signup using email otp. 
- 🎥 Movie Operations (Add, Delete, Approve by admin)
- 📝 Review Management (Add, View, Delete)
- 🧑‍💼 Admin Dashboard for realTime data using socket.io
- 🌐 CORS-enabled for cross-origin requests
- ☁️ Image Uploads via Cloudinary 
- 🔄 cookie-based auth which contain id and role
- 🛠 Database deployes on ##Railway and backend deploy on ##render

---

## 🛠 Tech Stack

| Layer         | Tech                             |
|--------------|----------------------------------|
| Language      | JavaScript (Node.js)             |
| Runtime       | Node.js                          |
| Framework     | Express.js                       |
| Database      | MySQL                            |
| Auth & Crypto | bcrypt, cookie-parser            |
| Uploads       | express-fileupload, Cloudinary   |
| Env Config    | dotenv                           |
| Dev Utils     | concurrently, fs, child_process  |


