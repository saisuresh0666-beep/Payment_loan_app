import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";
import PaymentForm from "../components/PaymentForm";
import "../style/Customer.css";

function Customer(){

  const {account} = useParams();
  const [customer,setCustomer] = useState(null);

  useEffect(()=>{

    axios.get(`${api}/customers/${account}`)
      .then(res => {

        if(res.data.length === 0){
          alert("Enter valid Account number");
        }else{
          setCustomer(res.data[0]);
        }

      });

  },[account]);

  if(!customer) return <p className="loading">Loading...</p>;

  return (

    <div className="customer-container">

      <div className="customer-card">

        <h2>Loan Details</h2>

        <div className="customer-row">
          <span>Account Number</span>
          <span>{customer.account_number}</span>
        </div>

        <div className="customer-row">
          <span>Interest Rate</span>
          <span>{customer.interest_rate}%</span>
        </div>

        <div className="customer-row">
          <span>Tenure</span>
          <span>{customer.tenure} months</span>
        </div>

        <div className="customer-row">
          <span>EMI Due</span>
          <span>₹{customer.emi_due}</span>
        </div>

      </div>

      <div className="payment-box">
        <PaymentForm account={account}/>
      </div>

      <Link className="history-link" to={`/history/${account}`}>
        View Payment History
      </Link>

    </div>

  );

}

export default Customer;
