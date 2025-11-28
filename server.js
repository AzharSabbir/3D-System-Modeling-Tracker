const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serves index.html

// Database Connection (CHANGE THESE TO YOUR PASSWORD)
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_H6euGPY5oKik@ep-red-lab-a1jc72q0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// 1. GET ALL SYSTEMS
app.get('/systems', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM systems ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 2. ADD NEW SYSTEM
app.post('/systems', async (req, res) => {
    const { system_name, batch_number, is_active_work, revision_status, completion_status, layers_data } = req.body;

    try {
        // If this is active work, set all others to false first (optional logic)
        if (is_active_work) {
            await pool.query('UPDATE systems SET is_active_work = false');
        }

        const result = await pool.query(
            `INSERT INTO systems (system_name, batch_number, is_active_work, revision_status, completion_status, layers_data) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [system_name, batch_number, is_active_work, revision_status, completion_status, JSON.stringify(layers_data)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 3. UPDATE SYSTEM
app.put('/systems/:id', async (req, res) => {
    const { id } = req.params;
    const { system_name, batch_number, is_active_work, revision_status, completion_status, layers_data } = req.body;

    try {
        if (is_active_work) {
            await pool.query('UPDATE systems SET is_active_work = false');
        }

        const result = await pool.query(
            `UPDATE systems SET system_name=$1, batch_number=$2, is_active_work=$3, revision_status=$4, completion_status=$5, layers_data=$6 
             WHERE id=$7 RETURNING *`,
            [system_name, batch_number, is_active_work, revision_status, completion_status, JSON.stringify(layers_data), id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 4. DELETE SYSTEM
app.delete('/systems/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM systems WHERE id = $1', [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});