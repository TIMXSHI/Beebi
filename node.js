const express = require('express');
const cors = require('cors')
const sql = require('mssql');
//const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(cors());
const config = {
    user: 'jeromexshi', // e.g., your Azure SQL admin username
    password: '%Jumpswim123', // NEVER expose in public repos
    server: 'beebi.database.windows.net',
    database: 'beebi',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Connect to the Database
const connectToDatabase = async () => {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to the database successfully');
    } catch (err) {
        console.error('Database connection failed', err);
        process.exit(1); // Stop the application if the database connection fails
    }
};

connectToDatabase();


app.post('/register', async (req, res) => {
    const { email, password, full_name, baby_name } = req.body;

    try {
        await sql.connect(config);
        await sql.query`
            INSERT INTO Customer (email, password, full_name, baby_name)
            VALUES (${email}, ${password}, ${full_name}, ${baby_name})`;

        res.status(200).json({ message: 'Registered successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));