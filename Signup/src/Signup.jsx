import { useState } from "react";

const Signup = () => {
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setWallet(accounts[0]);
  };


    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    const formData = new FormData();
    formData.append("wallet", wallet);
    formData.append("name", name);
    formData.append("role", role);
    formData.append("document", document);

    await fetch("http://localhost:5000/signup", {
      method: "POST",
      body: formData,
    });

    alert("Signup submitted. Waiting for admin approval.");
  };



  return (
    <div className="border-2 rounded h-1/2 flex justify-center p-10">
      <h2 className="text-4xl ">Stakeholder Signup</h2>

      <button className="bg-green-600 h-10 rounded " onClick={connectWallet}>
        {wallet ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      <p>Wallet: {wallet}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="MANUFACTURER">Manufacturer</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="RETAILER">Retailer</option>
        </select>

        <input
          type="file"
          onChange={(e) => setDocument(e.target.files[0])}
          required
        />

        <button type="submit">Submit Signup</button>
      </form>
    </div>
  );
}


export default Signup