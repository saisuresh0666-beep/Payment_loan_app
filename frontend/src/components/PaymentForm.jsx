import { useState } from "react";
import axios from "axios";
import api from "../api";
import "../style/PaymentForm.css";

function PaymentForm({ account }) {

  const [amount, setAmount] = useState("");

  const payEMI = async () => {

    if (!amount) {
      alert("Enter amount");
      return;
    }

    try {

      const res = await axios.post(`${api}/payments`, {
        account_number: account,
        amount: amount
      });

      alert(res.data.message);

      setAmount("");

    } catch (error) {
      alert.error(error)
      alert("Payment failed");
    }

  };

  return (

    <div className="payment-container">

      <h3>Pay EMI</h3>

      <input
        className="payment-input"
        placeholder="Enter Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button className="payment-btn" onClick={payEMI}>
        Pay
      </button>

    </div>

  );

}

export default PaymentForm;
