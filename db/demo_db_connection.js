var mysql = require('mysql'); 
var conn = mysql.createConnection({
    host:"sql8.freesqldatabase.com",
    user:"sql8649549",
    password:"k9GrEYZ8DR",
    database: 'sql8649549' 
}); 
module.exports = conn;