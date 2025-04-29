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

// ✅ Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    try {
        const result = await sql.query`
            SELECT * FROM Customer WHERE email = ${email} AND password = ${password}`;

        if (result.recordset.length === 0) {
            console.log('❌ Login failed:', email);
            return res.status(401).json({ error: 'Wrong email or password' });
        }
        const user = result.recordset[0]; 
        console.log('✅ Login success:', email);
        res.status(200).json({ 
            message: 'Login successful!',
            customer_id: user.customer_id,
            baby_name: user.baby_name
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ✅ Add sleep activity
app.post('/add-Sleep-activity', async (req, res) => {
    const { customer_id, start_time, end_time } = req.body;

    if (!customer_id || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const start = new Date(start_time);
        const end = new Date(end_time);
        const duration = Math.floor((end - start) / 60000); // minutes

        await sql.query`
            INSERT INTO Activity (CustomerID, Type, StartTime, EndTime, Duration)
            VALUES (${customer_id}, 'Sleep', ${start}, ${end}, ${duration})`;

        res.status(200).json({ message: 'Sleep Activity recorded successfully' });
    } catch (err) {
        console.error('❌ Failed to insert activity:', err);
        res.status(500).json({ error: 'Failed to insert Sleep activity' });
    }
});


// ✅ Add Feed Activity
app.post('/add-feed-activity', async (req, res) => {
    const { customer_id, start_time, milk_type, amount } = req.body;

    if (!customer_id || !start_time || !milk_type || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await sql.query`
            INSERT INTO Activity (
                CustomerID,
                Type,
                StartTime,
                StartCondition,
                StartLocation,
                EndCondition,
                EndTime,
                Duration,
                Notes
            )
            VALUES (
                ${customer_id},
                'Feed',
                ${start_time},
                ${milk_type},
                'Bottle',
                ${amount + 'ml'},
                NULL,
                NULL,
                NULL
            )
        `;

        res.status(200).json({ message: 'Feed activity recorded successfully' });
    } catch (err) {
        console.error('❌ Failed to insert feed activity:', err);
        res.status(500).json({ error: 'Failed to insert feed activity' });
    }
});

// ✅ Add Diaper Activity
app.post('/add-diaper-activity', async (req, res) => {
    const { customer_id, start_time, end_condition } = req.body;

    if (!customer_id || !start_time || !end_condition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await sql.query`
            INSERT INTO Activity (
                CustomerID,
                Type,
                StartTime,
                StartCondition,
                StartLocation,
                EndCondition,
                EndTime,
                Duration,
                Notes
            )
            VALUES (
                ${customer_id},
                'Diaper',
                ${start_time},
                NULL,
                NULL,
                ${end_condition},
                NULL,
                NULL,
                NULL
            )
        `;

        res.status(200).json({ message: 'Diaper activity recorded successfully' });
    } catch (err) {
        console.error('❌ Failed to insert diaper activity:', err);
        res.status(500).json({ error: 'Failed to insert diaper activity' });
    }
});


// ✅ Add Pumping Activity
app.post('/add-pumping-activity', async (req, res) => {
    const { customer_id, start_time, duration, left, right } = req.body;

    if (!customer_id || !start_time || !duration || left === undefined || right === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const start = new Date(start_time);
        const end = new Date(start.getTime() + duration * 60000); // Add minutes

        await sql.query`
            INSERT INTO Activity (
                CustomerID,
                Type,
                StartTime,
                Duration,
                EndTime,
                StartCondition,
                EndCondition,
                StartLocation,
                Notes
            )
            VALUES (
                ${customer_id},
                'Pump',
                ${start.toISOString()},
                ${duration},
                ${end.toISOString()},
                ${left + 'ml'},
                ${right + 'ml'},
                NULL,
                NULL
            )
        `;

        res.status(200).json({ message: '✅ Pumping activity recorded successfully' });
    } catch (err) {
        console.error('❌ Failed to insert pumping activity:', err);
        res.status(500).json({ error: 'Failed to insert pumping activity' });
    }
});

// ✅ Fetch activity
app.get('/fetch-activity', async (req, res) => {
    const customerId = req.query.customer_id;

    if (!customerId) {
        return res.status(400).json({ error: 'Missing customer_id parameter' });
    }

    try {
        const result = await sql.query`
            SELECT 
                ActivityID,
                CustomerID,
                Type,
                StartTime,
                EndTime,
                Duration,
                StartCondition,
                StartLocation,
                EndCondition,
                Notes
            FROM Activity
            WHERE CustomerID = ${customerId}
            ORDER BY StartTime DESC
        `;

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('❌ Failed to fetch activity data:', err);
        res.status(500).json({ error: 'Failed to fetch activity data' });
    }
});

// ✅ Update sleep activity
app.post('/update-sleep-activity', async (req, res) => {
    const { activity_id, customer_id, start_time, end_time } = req.body;

    if (!activity_id || !customer_id || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const start = new Date(start_time);
        const end = new Date(end_time);
        const duration = Math.floor((end - start) / 60000); // minutes

        await sql.query`
            UPDATE Activity
            SET StartTime = ${start}, EndTime = ${end}, Duration = ${duration}
            WHERE ActivityID = ${activity_id} AND CustomerID = ${customer_id} AND Type = 'Sleep'
        `;

        res.status(200).json({ message: '✅ Sleep activity updated successfully' });
    } catch (err) {
        console.error('❌ Failed to update activity:', err);
        res.status(500).json({ error: 'Failed to update Sleep activity' });
    }
});

// ✅ Update feed activity
app.post('/update-feed-activity', async (req, res) => {
    const { activity_id, customer_id, start_time, milk_type, amount } = req.body;

    if (!activity_id || !customer_id || !start_time || !milk_type || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const start = new Date(start_time);

        await sql.query`
            UPDATE Activity
            SET 
                CustomerID = ${customer_id},
                Type = 'Feed',
                StartTime = ${start},
                StartCondition = ${milk_type},
                EndCondition = ${amount}
            WHERE ActivityID = ${activity_id}
        `;

        res.status(200).json({ message: '✅ Feed activity updated successfully' });
    } catch (err) {
        console.error('❌ Failed to update feed activity:', err);
        res.status(500).json({ error: 'Failed to update feed activity' });
    }
});

// ✅ Update Diaper Activity
app.post('/update-diaper-activity', async (req, res) => {
    const { activity_id, customer_id, start_time, end_condition } = req.body;

    if (!activity_id || !customer_id || !start_time || !end_condition) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await sql.query`
            UPDATE Activity
            SET
                CustomerID = ${customer_id},
                StartTime = ${start_time},
                EndCondition = ${end_condition}
            WHERE ActivityID = ${activity_id}
              AND Type = 'Diaper'
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Diaper activity not found or not updated' });
        }

        res.status(200).json({ message: 'Diaper activity updated successfully' });
    } catch (err) {
        console.error('❌ Failed to update diaper activity:', err);
        res.status(500).json({ error: 'Failed to update diaper activity' });
    }
});

// ✅ Update Pumping Activity
app.post('/update-pumping-activity', async (req, res) => {
    const { activity_id, customer_id, start_time, duration, left, right } = req.body;

    if (!activity_id || !customer_id || !start_time || !duration || left === undefined || right === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const start = new Date(start_time);
        const end = new Date(start.getTime() + duration * 60000); // Add minutes

        await sql.query`
            UPDATE Activity
            SET
                CustomerID = ${customer_id},
                StartTime = ${start.toISOString()},
                Duration = ${duration},
                EndTime = ${end.toISOString()},
                StartCondition = ${left + 'ml'},
                EndCondition = ${right + 'ml'}
            WHERE ActivityID = ${activity_id} AND Type = 'Pump'
        `;

        res.status(200).json({ message: '✅ Pumping activity updated successfully' });
    } catch (err) {
        console.error('❌ Failed to update pumping activity:', err);
        res.status(500).json({ error: 'Failed to update pumping activity' });
    }
});


// 🗑️ Delete activity
app.delete('/delete-activity/:activity_id', async (req, res) => {
    const { activity_id } = req.params;

    if (!activity_id) {
        return res.status(400).json({ error: 'Missing activity_id' });
    }

    try {
        const result = await sql.query`
            DELETE FROM Activity WHERE ActivityID = ${activity_id}
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.status(200).json({ message: '🗑️ Activity deleted successfully' });
    } catch (err) {
        console.error('❌ Failed to delete activity:', err);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
});

// ✅ Sync sleep timer (insert or update)
app.post('/sync-sleep-timer', async (req, res) => {
    const { customer_id, child_name, start_time } = req.body;

    if (!customer_id || !child_name || !start_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await sql.query`
            MERGE SleepTimer AS target
            USING (SELECT ${customer_id} AS CustomerID, ${child_name} AS ChildName) AS source
            ON (target.CustomerID = source.CustomerID AND target.ChildName = source.ChildName)
            WHEN MATCHED THEN
                UPDATE SET StartTime = ${start_time}
            WHEN NOT MATCHED THEN
                INSERT (CustomerID, ChildName, StartTime)
                VALUES (${customer_id}, ${child_name}, ${start_time});
        `;

        res.status(200).json({ message: '✅ Sleep timer synced successfully' });
    } catch (err) {
        console.error('❌ Failed to sync sleep timer:', err);
        res.status(500).json({ error: 'Failed to sync sleep timer' });
    }
});

// ✅ Fetch synced sleep timer
app.get('/get-sleep-timer', async (req, res) => {
    const { customer_id, child_name } = req.query;

    if (!customer_id || !child_name) {
        return res.status(400).json({ error: 'Missing query parameters' });
    }

    try {
        const result = await sql.query`
            SELECT StartTime FROM SleepTimer
            WHERE CustomerID = ${customer_id} AND ChildName = ${child_name}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'No timer found for this user and child' });
        }

        const startTime = result.recordset[0].StartTime;

        res.status(200).json({ start_time: startTime });
    } catch (err) {
        console.error('❌ Failed to fetch sleep timer:', err);
        res.status(500).json({ error: 'Failed to fetch sleep timer' });
    }
});




// ✅ Use Azure-assigned port or fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
