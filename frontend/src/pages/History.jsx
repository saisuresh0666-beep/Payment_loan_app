import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";
import "../style/History.css";

function History(){

  const { account } = useParams();
  const [payments, setPayments] = useState([]);

  useEffect(() => {

    axios.get(`${api}/payments/${account}`)
      .then(res => setPayments(res.data));

  }, [account]);

  return(

    <div className="history-container">

      <h2>Payment History</h2>

      {payments.length === 0 ? (
        <p>No payment history found</p>
      ) : (

        <table className="history-table">

          <thead>
            <tr>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {payments.map((p,i)=>(
              <tr key={i}>
                <td data-label="Amount">{p.payment_amount}</td>
                <td data-label="Date">{new Date(p.payment_date).toLocaleDateString()}</td>
                <td data-label="Status">Completed</td>
              </tr>
            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}

export default History;
