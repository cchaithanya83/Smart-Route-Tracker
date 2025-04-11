// src/components/ExtraWasteForm.tsx

import { useState } from "react";
import axios from "axios";

const ExtraWasteForm = () => {
  const [houseId, setHouseId] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8000/extra-waste-request/", {
        house_id: houseId,
        message,
      });

      alert("Request submitted successfully!");
      setHouseId("");
      setMessage("");
    } catch (error) {
      alert("Error submitting request");
      console.error(error);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Request Extra Waste Pickup
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 text-white">House ID</label>
          <input
            type="text"
            value={houseId}
            onChange={(e) => setHouseId(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="Enter your house ID"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-white">Message / Description</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="Mention any details..."
            required
          />
        </div>

        <button
          type="submit"
          className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default ExtraWasteForm;
