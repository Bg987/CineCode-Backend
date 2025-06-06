const express = require('express');
const router = express.Router();
const db = require('./db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

// Serve static images
router.use('/images', express.static("C:/Users/HP/SE/data/movies"));

// Get movies with optional name filter
router.get('/', (req, res) => {
  const userCookie = req.headers.cookie;
  if (!userCookie) {
    return res.status(400).json({ error: "unauthorized user" });
  }
  const token = userCookie.split('=')[1];
  const decoded = jwt.verify(token, secretKey);
  const role = decoded.role;//admin or user
  const userId = decoded.id;
  if (!role || role != 'user') {
    return res.status(400).json({ error: "bad request" });
  }
  const { name, lang, year } = req.query;
  let query = 'SELECT * FROM movies WHERE Approved = ?';
  const params = [];
  params.push(1);
  if (name) {
    query += ' AND Mname LIKE ? ';
    params.push(`%${name}%`);
  }
  if (lang) {
    query += ' AND Language = ? ';
    params.push(`${lang}`);
  }
  if (year) {
    query += ' AND Year = ? ';
    params.push(`${year}`);
  }
  query += ' ORDER BY Mname;';
  try {
    db.query(query, params, (err, movies) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Server error' });
      }
      // Add image URL to each movie
      const moviesWith = movies.map(movie => ({
        ...movie,
        By: userId === movie.By ? "You" : movie.By,
      }));
      res.json(moviesWith);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
//send movie details to give review
router.post('/id', (req, res) => {
  const { id } = req.body;
  let query = 'SELECT * FROM movies WHERE Mid = ?';
  try {
    db.query(query, id, (err, moviesData) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
      }
      if (moviesData.length > 0) {
        const moviesWith = moviesData.map(movie => ({
          ...movie,
          By: userId === movie.By ? "You" : movie.By,
        }));
        res.json(moviesWith);
      }
      else {
        res.status(400).send('Error in database');
      }
      // Add image URL to each movie
    });
  }
  catch (err) {
    console.error("error : " + err);
    res.status(500).send('Error');
  }
});

module.exports = router;
