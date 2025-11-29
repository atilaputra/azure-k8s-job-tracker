const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer (Memory Storage so we can save to DB)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Config
const dbConfig = {
    host: process.env.DB_HOST || 'mysql-service', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'webapp'
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig);
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to db:', err);
            setTimeout(handleDisconnect, 2000); 
        } else {
            console.log('Connected to MySQL!');
            
            // Create Users Table
            const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            db.query(createUsersTable, (err) => {
                if (err) console.error('Error creating users table:', err);
                else console.log('Users table ready');
            });
            
            // Create Jobs Table
            const createJobsTable = `CREATE TABLE IF NOT EXISTS jobs (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                company VARCHAR(255),
                title VARCHAR(255),
                status VARCHAR(50),
                resume_data LONGBLOB,
                resume_name VARCHAR(255),
                resume_type VARCHAR(50),
                date_applied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            db.query(createJobsTable, (err) => {
                if (err) console.error('Error creating jobs table:', err);
                else {
                    console.log('Jobs table ready');
                    
                    // Add job_link column if it doesn't exist
                    db.query(`ALTER TABLE jobs ADD COLUMN job_link TEXT AFTER status`, (err) => {
                        if (err) {
                            // Column might already exist, that's okay
                            if (err.code === 'ER_DUP_FIELDNAME') {
                                console.log('job_link column already exists');
                            } else {
                                console.error('Error adding job_link column:', err);
                            }
                        } else {
                            console.log('job_link column added');
                        }
                    });
                }
            });
        }
    });
    db.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') handleDisconnect();
        else throw err;
    });
}

handleDisconnect();

// --- USER AUTHENTICATION ROUTES ---

// Register User
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Insert new user
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', 
            [username, password], 
            (err, result) => {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                
                console.log(`User registered: ${username}`);
                res.json({ 
                    message: 'User registered successfully',
                    userId: result.insertId,
                    username: username
                });
            }
        );
    });
});

// Login User
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    db.query('SELECT id, username FROM users WHERE username = ? AND password = ?', 
        [username, password], 
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            
            console.log(`User logged in: ${username}`);
            res.json({ 
                message: 'Login successful',
                user: { 
                    id: results[0].id, 
                    username: results[0].username 
                }
            });
        }
    );
});

// --- JOB TRACKER ROUTES ---

// 1. Get All Jobs (include job_link)
app.get('/api/jobs', (req, res) => {
    db.query('SELECT id, company, title, status, job_link, date_applied, resume_name FROM jobs ORDER BY date_applied DESC', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch jobs' });
        }
        res.json(results);
    });
});

// 2. Add New Job (with File and Link)
app.post('/api/jobs', upload.single('resume'), (req, res) => {
    const { company, title, status, jobLink } = req.body;
    let resumeData = null;
    let resumeName = null;
    let resumeType = null;

    if (req.file) {
        resumeData = req.file.buffer;
        resumeName = req.file.originalname;
        resumeType = req.file.mimetype;
    }

    const sql = 'INSERT INTO jobs (company, title, status, job_link, resume_data, resume_name, resume_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [company, title, status, jobLink || null, resumeData, resumeName, resumeType], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to create job' });
        }
        res.json({ id: result.insertId, company, title, job_link: jobLink });
    });
});

// 3. Download Resume
app.get('/api/jobs/:id/resume', (req, res) => {
    const sql = 'SELECT resume_data, resume_name, resume_type FROM jobs WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch resume' });
        }
        if (result.length === 0 || !result[0].resume_data) {
            return res.status(404).send('No resume found');
        }
        
        const file = result[0];
        res.setHeader('Content-Type', file.resume_type);
        res.setHeader('Content-Disposition', `attachment; filename=${file.resume_name}`);
        res.send(file.resume_data);
    });
});

// 4. Delete Job
app.delete('/api/jobs/:id', (req, res) => {
    db.query('DELETE FROM jobs WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete job' });
        }
        res.json({ message: 'Deleted' });
    });
});

// 5. Update Job (handles both status and full edit)
app.put('/api/jobs/:id', (req, res) => {
    const { status, company, title, jobLink } = req.body;
    
    // If only status is provided, update just status (backward compatible)
    if (status && !company && !title) {
        db.query('UPDATE jobs SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update job' });
            }
            res.json({ message: 'Updated' });
        });
    } else {
        // Full update for edit feature
        const sql = 'UPDATE jobs SET company = ?, title = ?, status = ?, job_link = ? WHERE id = ?';
        db.query(sql, [company, title, status, jobLink || null, req.params.id], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update job' });
            }
            res.json({ message: 'Updated' });
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(5000, () => console.log('Job Tracker Backend running on 5000'));