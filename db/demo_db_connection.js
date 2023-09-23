var mysql = require('mysql'); 
var conn = mysql.createConnection({
    host:"sql9.freesqldatabase.com",
    user:"sql9647866",
    password:"Vcnd49Bx9Z",
    database: 'sql9647866' 
}); 
module.exports = conn;