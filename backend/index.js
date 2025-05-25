// BACKEND: Express (Node.js via supabase)

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = 5002;
app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:5173', // allow frontend origin
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true               // if you need cookies or sessions
// }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 20, // Adjust based on Supabase plan
  connectionTimeoutMillis: 10000, // 10 seconds
});

module.exports = pool;

//To confirm DB connection is healthy and exits or not
pool
  .connect()
  .then(() => console.log("Connected to database"))
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });

// Home Route
app.get("/", (req, res) => {
  res.send({
    message:
      "Welcome to UPI App. Use /register to create account or /login to login.",
  });
});

const todayDate = () => new Date().toISOString().split("T")[0];

//To Register User
app.post("/register", async (req, res) => {
  const { phone } = req.body;
  if (!/^\d{10}$/.test(phone))
    return res.status(400).send({ error: "Invalid phone number" });

  const userExists = await pool.query(`SELECT * FROM users WHERE phone = $1`, [
    phone,
  ]);
  if (userExists.rowCount > 0)
    return res.status(400).send({ error: "User already exists" });

  const newUser = await pool.query(
    `INSERT INTO users (phone, upi_enabled) VALUES ($1, false) RETURNING id`,
    [phone]
  );
  await pool.query(`INSERT INTO accounts (user_id, balance) VALUES ($1, 0)`, [
    newUser.rows[0].id,
  ]);
  res.send({ message: "User registered successfully" });
});

//To Login User
app.post("/login", async (req, res) => {
  const { phone } = req.body;
  const result = await pool.query(`SELECT * FROM users WHERE phone = $1`, [
    phone,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).send({ error: "User not found" });
  }

  const user = result.rows[0];
  res.send({ success: true, upi_enabled: user.upi_enabled });
});

//To Enable UPI
app.post("/enable-upi", async (req, res) => {
  const { phone } = req.body;
  await pool.query(`UPDATE users SET upi_enabled = true WHERE phone = $1`, [
    phone,
  ]);
  res.send({ message: "UPI Enabled" });
});

//To Disable UPI
app.post("/disable-upi", async (req, res) => {
  const { phone } = req.body;
  await pool.query(`UPDATE users SET upi_enabled = false WHERE phone = $1`, [
    phone,
  ]);
  res.send({ message: "UPI Disabled" });
});

//To Add Money
app.post("/add-money", async (req, res) => {
  const { phone, amount } = req.body;
  const user = await pool.query(
    `SELECT * FROM users WHERE phone = $1 AND upi_enabled = true`,
    [phone]
  );
  if (!user.rowCount) return res.status(400).send({ error: "UPI not enabled" });

  const account = await pool.query(
    `SELECT * FROM accounts WHERE user_id = $1`,
    [user.rows[0].id]
  );
  if (parseFloat(account.rows[0].balance) + amount > 100000)
    return res.status(400).send({ error: "Balance limit exceeded" });

  await pool.query(
    `UPDATE accounts SET balance = balance + $1 WHERE user_id = $2`,
    [amount, user.rows[0].id]
  );
  await pool.query(
    `INSERT INTO transactions (to_user_id, amount, type) VALUES ($1, $2, 'ADD_MONEY')`,
    [user.rows[0].id, amount]
  );

  res.send({ message: "Money added" });
});

//To Transfer Money
app.post("/transfer", async (req, res) => {
  const { fromPhone, toPhone, amount } = req.body;
  const fromUser = await pool.query(
    `SELECT * FROM users WHERE phone = $1 AND upi_enabled = true`,
    [fromPhone]
  );
  const toUser = await pool.query(
    `SELECT * FROM users WHERE phone = $1 AND upi_enabled = true`,
    [toPhone]
  );

  if (!fromUser.rowCount || !toUser.rowCount)
    return res.status(400).send({ error: "Invalid users" });
  if (amount > 20000)
    return res.status(400).send({ error: "Max transfer amount is 20k" });

  const fromId = fromUser.rows[0].id;
  const today = new Date().toISOString().split("T")[0];
  const dayTransfers = await pool.query(
    `SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE from_user_id = $1 AND type = 'TRANSFER' AND created_at::date = $2`,
    [fromId, today]
  );

  if (
    dayTransfers.rows[0].count >= 3 ||
    parseFloat(dayTransfers.rows[0].total || 0) + amount > 50000
  ) {
    return res.status(400).send({ error: "Transfer limits exceeded" });
  }

  const balance = await pool.query(
    `SELECT balance FROM accounts WHERE user_id = $1`,
    [fromId]
  );
  if (parseFloat(balance.rows[0].balance) < amount)
    return res.status(400).send({ error: "Insufficient balance" });

  await pool.query("BEGIN");
  await pool.query(
    `UPDATE accounts SET balance = balance - $1 WHERE user_id = $2`,
    [amount, fromId]
  );
  await pool.query(
    `UPDATE accounts SET balance = balance + $1 WHERE user_id = $2`,
    [amount, toUser.rows[0].id]
  );
  await pool.query(
    `INSERT INTO transactions (from_user_id, to_user_id, amount, type) VALUES ($1, $2, $3, 'TRANSFER')`,
    [fromId, toUser.rows[0].id, amount]
  );
  await pool.query("COMMIT");

  res.send({ message: "Transfer successful" });
});

//To Get Balance
app.get("/balance/:phone", async (req, res) => {
  const phone = req.params.phone;
  const user = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
  if (!user.rowCount) return res.status(404).send({ error: "User not found" });

  const account = await pool.query(
    `SELECT balance FROM accounts WHERE user_id = $1`,
    [user.rows[0].id]
  );
  res.send({ balance: account.rows[0].balance });
});

console.log("Starting server...");

app.listen(port, () => console.log(`Server running on port ${port}`));

//Commented codes are mostly due to fixing issues
// app.use((err, req, res, next) => {
//   console.error('Global error handler:', err);
//   res.status(500).json({ error: 'Something went wrong' });
// });
