import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Home.css";

function Home() {

  const [account,setAccount] = useState("");
  const navigate = useNavigate();

  const searchAccount = () => {

    if(!account){
      alert("Please enter your account number");
    } else {
      navigate(`/customer/${account}`);
    }

  }

  return (

    <div className="home-container">

      <div className="home-card">

        <h2>Loan Payment App</h2>

        <p>Enter your account number for loan details</p>

        <input
          className="home-input"
          placeholder="Enter Account Number"
          value={account}
          onChange={(e)=>setAccount(e.target.value)}
        />

        <button className="home-btn" onClick={searchAccount}>
          Search
        </button>

      </div>

    </div>

  );
}

export default Home;