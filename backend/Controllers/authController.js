const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.json({ success: false, message: "Email already registered" });
            }
            console.log("REGISTER ERROR:", err);
            return res.json({ success: false, message: "Server Error" });
        }
        res.json({ success: true, message: "Registered Successfully" });
    });
};

// LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.log("LOGIN DB ERROR:", err);
            return res.json({ success: false, message: "Server Error" });
        }

        if (result.length === 0) {
            return res.json({ success: false, message: "User not found" });
        }

        const user = result[0];
        const isPasswordMatch = bcrypt.compareSync(password, user.password);

        if (!isPasswordMatch) {
            return res.json({ success: false, message: "Incorrect Password" });
        }

        res.json({
            success: true,
            message: "Login Successful",
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
};
