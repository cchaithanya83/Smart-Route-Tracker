import React, { useState } from "react";
import axios from "axios";

const PhoneNumberForm: React.FC = () => {
  const [houseId, setHouseId] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const savePhoneNumber = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/set-phone-number", {
        house_id: houseId,
        phone_number: phoneNumber,
      });
      alert("Phone number saved successfully!");
    } catch (error) {
      console.error("Error saving phone number", error);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Set Phone Number</h1>
      <div className="space-y-4">
        <input
          type="number"
          value={houseId}
          onChange={(e) => setHouseId(Number(e.target.value))}
          placeholder="Enter House ID"
          className="w-full p-2 bg-gray-700 rounded text-white"
        />
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter Phone Number"
          className="w-full p-2 bg-gray-700 rounded text-white"
        />
        <button
          onClick={savePhoneNumber}
          className="bg-green-500 px-4 py-2 rounded shadow text-white"
        >
          Save Phone Number
        </button>
      </div>
    </div>
  );
};

export default PhoneNumberForm;
