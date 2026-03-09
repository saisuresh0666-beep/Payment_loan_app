const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");

app.use(cors());
app.use(express.json());

/* DATABASE CONNECTION */

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "payment_app_db"
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("MySQL Connected");
  }
});


/* GET ALL CUSTOMERS */

app.get("/customers", (req, res) => {

  db.query("SELECT * FROM customers", (err, result) => {

    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }

  });

});


/* GET SINGLE CUSTOMER */

app.get("/customers/:account", (req, res) => {

  const account = req.params.account;

  db.query(
    "SELECT * FROM customers WHERE account_number = ?",
    [account],
    (err, result) => {

      if (err) {
        res.send(err);
      } else {
        res.json(result);
      }

    }
  );

});


/* MAKE PAYMENT */

app.post("/payments", (req, res) => {

  const { account_number, amount } = req.body;

  if (!account_number || !amount) {
    return res.status(400).json({
      message: "Account number and amount required"
    });
  }

  db.query(
    "SELECT id, emi_due FROM customers WHERE account_number = ?",
    [account_number],
    (err, result) => {

      if (err) return res.send(err);

      if (result.length === 0) {
        return res.json({ message: "Account not found" });
      }

      const customerId = result[0].id;
      const emiDue = result[0].emi_due;

      if (amount > emiDue) {
        return res.json({ message: "Amount exceeds EMI due" });
      }

      /* INSERT PAYMENT */

      db.query(
        "INSERT INTO payments (customer_id, payment_date, payment_amount, status) VALUES (?, NOW(), ?, ?)",
        [customerId, amount, "SUCCESS"],
        (err) => {

          if (err) return res.send(err);

          /* UPDATE EMI DUE */

          db.query(
            "UPDATE customers SET emi_due = emi_due - ? WHERE id = ?",
            [amount, customerId],
            (err) => {

              if (err) return res.send(err);

              res.json({ message: "Payment Successful" });

            }
          );

        }
      );

    }
  );

});


/* PAYMENT HISTORY */

app.get("/payments/:account", (req, res) => {

  const account = req.params.account;

  db.query(
    `SELECT payments.*
     FROM payments
     JOIN customers
     ON payments.customer_id = customers.id
     WHERE customers.account_number = ?`,
    [account],
    (err, result) => {

      if (err) {
        res.send(err);
      } else {
        res.json(result);
      }

    }
  );

});

/* STATIC FRONTEND */

app.use(express.static(frontendDistPath));

app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/customers") || req.path.startsWith("/payments")) {
    return next();
  }

  res.sendFile(path.join(frontendDistPath, "index.html"));
});


/* SERVER */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
