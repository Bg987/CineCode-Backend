
module.exports = (server) => {
    const { Server } = require('socket.io');
    const db = require('./db');
    const io = new Server(server, {
        cors: {
            origin: 'https://cine-code-frontend.vercel.app', //frontend
            methods: ['GET', 'POST'],
            withCredentials: true, 
        },
    });
    io.on('connection', (socket) => {
        socket.on("req", () => {
            emitDashboardData(); // Send the dashboard data again
        });
        socket.on('disconnect', () => {
            //console.log('A client disconnected');
        });
    });
    function ActiveU() {
        const sql = 'SELECT COUNT(*) AS count FROM activeu';
        db.query(sql, (err, result) => {
            if (err) {
                console.log("Error in ActiveU: ", err);
                io.emit('ActiveU', "error");
                return;
            }
            try{
            io.emit('ActiveU', result[0].count);
            }
            catch(err){
                console.log("Error in ActiveU: ", err);
                io.emit('ActiveU', "error");
            }
        });
    } // Emit every 5 seconds    
    setInterval(() => {
        ActiveU();
    }, 5000); 
    // Emit dashboard data to admin
    function emitDashboardData() {
        ActiveU();
        getDashboardData((data) => {
            //console.log(data);
            io.emit('dashboard', data);
        });
    }
    // Fetch dashboard data
    function getDashboardData(callback) {
        const data = {};
        const queries = [
            { key: 'userNo', sql: 'SELECT COUNT(*) AS count FROM userdata' },
            { key: 'movieNo', sql: 'SELECT COUNT(*) AS count FROM movies WHERE Approved = ?',params: [1] },
            { key: 'AdminMovieNo', sql: 'SELECT COUNT(*) AS count FROM movies WHERE `By` = ?', params: ['Admin'] },
            { key: 'AppMovieNo', sql: 'SELECT COUNT(*) AS count FROM movies WHERE Approved = ?', params: [0] },
            { key: 'LongestMovie', sql: 'SELECT * FROM  movies WHERE Approved = ? ORDER BY Duration DESC LIMIT 1',params: [1] },
            { key: 'SmallestMovie', sql: 'SELECT * FROM  movies WHERE Approved = ? ORDER BY Duration ASC LIMIT 1',params: [1] },
        ];
        let completed = 0;
        queries.forEach((query) => {
            db.query(query.sql, query.params || [], (err, results) => {
                if (err) {
                    console.error(`Error executing query for ${query.key}:`, err);
                } else {
                    data[query.key] = Array.isArray(results) && results.length ? results[0] : results;
                }
                // When all queries are complete, call the callback
                completed++;
                if (completed === queries.length) {
                    callback(data);
                }
            });
        });
    }
    return {
        emitDashboardData,ActiveU // Exporting the function
    };
};
