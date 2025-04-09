const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

app.use(express.json());  // ✅ Parses incoming JSON
app.use(cors());

// ✅ Azure SQL config
const config = {
    user: 'jeromexshi',
    password: '%Jumpswim123',
    server: 'beebi.database.windows.net',
    database: 'beebi',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// ✅ Connect to the database once on startup
const connectToDatabase = async () => {
    try {
        await sql.connect(config);
        console.log('✅ Connected to the database successfully');
    } catch (err) {
        console.error('❌ Database connection failed', err);
        process.exit(1);
    }
};

connectToDatabase();

// ✅ Test GET route for browser check
app.get('/', (req, res) => {
    res.send('🚀 Beebi backend is alive!');
});

// ✅ Register route
app.post('/register', async (req, res) => {
    const { email, password, full_name, baby_name } = req.body;

    console.log('📥 Received /register request:', req.body); // Debug log

  try {
        // ✅ Check if email is already used
        const result = await sql.query`SELECT * FROM Customer WHERE email = ${email}`;
        if (result.recordset.length > 0) {
            return res.status(409).json({ error: 'Email has already been registered.' });
        }

        // ✅ Insert new customer
        await sql.query`
            INSERT INTO Customer (email, password, full_name, baby_name)
            VALUES (${email}, ${password}, ${full_name}, ${baby_name})`;

        console.log('✅ Inserted record for:', email);
        res.status(200).json({ message: 'Registered successfully!' });
    } catch (err) {
        console.error('❌ Registration failed:', err);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
});
// ✅ Use Azure-assigned port or fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
