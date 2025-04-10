const express = require('express');
const router = express.Router();
const db = require('./db'); 


// Serve static images
router.use('/images', express.static("C:/Users/HP/SE/data/movies"));

// Get movies with optional name filter
router.get('/', (req, res) => {
  const userCookie = req.headers.cookie;
  if (!userCookie) {
    return res.status(400).json({ error: "unauthorized user" });
  }
 //console.log("call")
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
      const moviesWithImages = movies.map(movie => ({
        ...movie,
        ImageUrl: `/apiSeeM/images/${movie.Mid}.jpg` // URL for the static image
      }));
      res.json(moviesWithImages);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
//send movie details to give review
router.post('/id', (req, res) => {
  const { id } = req.body;
  let Uid;
  let query = 'SELECT * FROM movies WHERE Mid = ?';
  try {
    db.query(query, id, (err, movies) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
      }
      if (movies.length > 0) {
        let moviesData = movies.map(movie => ({
          ...movie,
          ImageUrl: `/apiSeeM/images/${movie.Mid}.jpg`, // URL for the static image
        }));
        res.json(moviesData);
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
