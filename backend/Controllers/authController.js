const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = (req, res) => {
    try {
        console.log('AUTH REGISTER request body:', req.body);
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            console.warn('REGISTER missing fields:', { namePresent: !!name, emailPresent: !!email, passwordPresent: !!password });
            return res.status(400).json({ success: false, message: 'Missing name, email or password' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('REGISTER DB ERROR:', err);
                if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                    return res.status(409).json({ success: false, message: 'Email already registered' });
                }
                return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
            }
            console.log('REGISTER success, insertedId:', result && result.insertId);
            res.json({ success: true, message: 'Registered Successfully' });
        });
    } catch (err) {
        console.error('REGISTER UNEXPECTED ERROR:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// LOGIN
exports.login = (req, res) => {
    try {
        console.log('AUTH LOGIN request body:', req.body);
        const { email, password } = req.body || {};

        if (!email || !password) {
            console.warn('LOGIN missing fields:', { emailPresent: !!email, passwordPresent: !!password });
            return res.status(400).json({ success: false, message: 'Missing email or password' });
        }

        const sql = 'SELECT * FROM users WHERE email = ?';
        db.query(sql, [email], (err, result) => {
            if (err) {
                console.error('LOGIN DB ERROR:', err);
                return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
            }

            if (!result || result.length === 0) {
                console.log('LOGIN user not found for email:', email);
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            const user = result[0];
            const isPasswordMatch = bcrypt.compareSync(password, user.password);

            if (!isPasswordMatch) {
                console.log('LOGIN incorrect password for user id:', user.id);
                return res.status(401).json({ success: false, message: 'Incorrect Password' });
            }

            console.log('LOGIN success for user id:', user.id);
            res.json({
                success: true,
                message: 'Login Successful',
                user: { id: user.id, name: user.name, email: user.email }
            });
        });
    } catch (err) {
        console.error('LOGIN UNEXPECTED ERROR:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
