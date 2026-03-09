const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const port = process.env.PORT || 5000;
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
const dbFilePath = path.resolve(__dirname, process.env.DB_FILE || "./data/payment_app.db");
const dbDirectory = path.dirname(dbFilePath);

app.use(cors());
app.use(express.json());

/* DATABASE CONNECTION */

fs.mkdirSync(dbDirectory, { recursive: true });

const db = new DatabaseSync(dbFilePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT NOT NULL UNIQUE,
    interest_rate REAL NOT NULL,
    tenure INTEGER NOT NULL,
    emi_due REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_amount REAL NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
`);

console.log(`SQLite connected: ${dbFilePath}`);


/* GET ALL CUSTOMERS */

app.get("/api/customers", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers ORDER BY id").all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


/* GET SINGLE CUSTOMER */

app.get("/api/customers/:account", (req, res) => {
  const account = req.params.account;
  try {
    const result = db
      .prepare("SELECT * FROM customers WHERE account_number = ?")
      .all(account);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


/* MAKE PAYMENT */

app.post("/api/payments", (req, res) => {
  const { account_number, amount } = req.body;
  const paymentAmount = Number(amount);

  if (!account_number || Number.isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({
      message: "Valid account number and amount required"
    });
  }

  let transactionStarted = false;

  try {
    const customer = db
      .prepare("SELECT id, emi_due FROM customers WHERE account_number = ?")
      .get(account_number);

    if (!customer) {
      return res.json({ message: "Account not found" });
    }

    if (paymentAmount > customer.emi_due) {
      return res.json({ message: "Amount exceeds EMI due" });
    }

    const insertPayment = db.prepare(
      "INSERT INTO payments (customer_id, payment_amount, status) VALUES (?, ?, ?)"
    );
    const updateCustomer = db.prepare(
      "UPDATE customers SET emi_due = emi_due - ? WHERE id = ?"
    );

    db.exec("BEGIN");
    transactionStarted = true;
    insertPayment.run(customer.id, paymentAmount, "SUCCESS");
    updateCustomer.run(paymentAmount, customer.id);
    db.exec("COMMIT");
    transactionStarted = false;

    res.json({ message: "Payment Successful" });
  } catch (error) {
    if (transactionStarted) {
      db.exec("ROLLBACK");
    }

    res.status(500).json({ message: error.message });
  }

});


/* PAYMENT HISTORY */

app.get("/api/payments/:account", (req, res) => {
  const account = req.params.account;
  try {
    const result = db.prepare(
      `SELECT payments.*
       FROM payments
       JOIN customers
       ON payments.customer_id = customers.id
       WHERE customers.account_number = ?
       ORDER BY payments.payment_date DESC`
    ).all(account);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* STATIC FRONTEND */

app.use(express.static(frontendDistPath));

app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendDistPath, "index.html"));
});


/* SERVER */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
