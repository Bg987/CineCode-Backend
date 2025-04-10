const fs = require("fs");

function logUser(str) {
    const finStr = str + " " + timeFetch();
    try {
        fs.appendFileSync("logFiles/logUser.txt", finStr);
        return 0;
    }
    catch (err) {
        return err;
    }
}
function logAdmin(str) {
    const finStr = str + " " + timeFetch();
    try {
        fs.appendFileSync("logFiles/logAdmin.txt", finStr);
        return 0;
    }
    catch (err) {
        return err;
    }
}
function timeFetch() {
    let day;
    const data = new Date();
    switch (data.getDay()) {
        case 0: day = "Sunday"; break;
        case 1: day = "Monday"; break;
        case 2: day = "Tuesday"; break;
        case 3: day = "Wednesday"; break;
        case 4: day = "Thursday"; break;
        case 5: day = "Friday"; break;
        case 6: day = "Saturday"; break;
        default: day = "no"; break;
    };
    const Data = data.getDate() + "-" + (data.getMonth() + 1) + "-" + data.getFullYear() + " " + data.getHours() + ":" + data.getMinutes() + ":" + data.getSeconds() + " " + day;
    return Data;
}
module.exports = { logUser, logAdmin };