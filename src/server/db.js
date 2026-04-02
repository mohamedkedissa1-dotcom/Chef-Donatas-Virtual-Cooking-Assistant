import mysql from "mysql";

const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',      // default in XAMPP
  password: '',      // default is empty
  database: 'recipes_db',
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL');
});

export default db;