const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbFilePath = path.resolve(__dirname, process.env.DB_FILE || "./data/payment_app.db");

fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

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

const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers (account_number, interest_rate, tenure, emi_due)
  VALUES (?, ?, ?, ?)
`);

const sampleCustomers = [
  ["ACC1001", 8.5, 24, 4500],
  ["ACC1002", 9.25, 36, 6200],
  ["ACC1003", 10.1, 18, 3800],
];

for (const customer of sampleCustomers) {
  insertCustomer.run(...customer);
}

const summary = db.prepare("SELECT COUNT(*) AS count FROM customers").get();

console.log(`Seed complete. Customers available: ${summary.count}`);
