const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("./models/db");

//signup and hash password creation
exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.request()
      .input("Username", username)
      .input("PasswordHash", hash)
      .query("INSERT INTO Users (Username, PasswordHash) VALUES (@Username, @PasswordHash)");
    res.status(201).json({ message: "User created successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Error signing up." });
  }
};

//for login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.request()
      .input("Username", username)
      .query("SELECT * FROM Users WHERE Username = @Username");

    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user.UserID }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Error logging in." });
  }
};
