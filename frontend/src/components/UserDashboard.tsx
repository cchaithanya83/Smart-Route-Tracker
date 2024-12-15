import React, { useState, useEffect } from "react";
import axios from "axios";

// Interface for the house data that we will be displaying
interface HouseDetails {
  house_id: number;
  last_visited_date: string | null;
  phone_number: string | null;
  time_to_reach: string;
  visit_date: string; // To handle visits based on selected date
}

const UserDashboard: React.FC = () => {
  const [selectedHouseId, setSelectedHouseId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [houses, setHouses] = useState<HouseDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to generate the last 10 days in YYYY-MM-DD format
  const generateLast10Days = () => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  const getHouseDetails = async (houseId: number, date: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/get-house-details?houseId=${houseId}&date=${date}`
      );
      const houseData = response.data;
      setHouses(houseData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching house details:", error);
      setLoading(false);
    }
  };

  // Handle change in house ID (for manual entry)
  const handleHouseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const houseId = Number(e.target.value);
    if (!isNaN(houseId) && houseId > 0) {
      setSelectedHouseId(houseId);
    }
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  useEffect(() => {
    if (selectedHouseId && selectedDate) {
      getHouseDetails(selectedHouseId, selectedDate);
    }
  }, [selectedHouseId, selectedDate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto p-6 w-full max-w-lg bg-gray-800 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          User Dashboard - House Details
        </h1>

        {/* House Number Input */}
        <div className="my-4">
          <label htmlFor="house" className="block text-lg font-medium mb-2">
            Enter House ID:
          </label>
          <input
            type="number"
            id="house"
            value={selectedHouseId || ""}
            onChange={handleHouseChange}
            placeholder="Enter a house number"
            className="p-2 w-full border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Date Selection */}
        <div className="my-4">
          <label htmlFor="date" className="block text-lg font-medium mb-2">
            Select Date:
          </label>
          <select
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="p-2 w-full border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-600"
          >
            <option value="" disabled>
              Select Date
            </option>
            {generateLast10Days().map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-blue-500">Loading...</p>
        ) : (
          <div className="mt-6">
            <h2 className="text-2xl font-medium mb-4 text-center">
              Details for House {selectedHouseId} on {selectedDate}
            </h2>
            <ul className="space-y-4">
              {houses.length > 0 ? (
                houses.map((house) => (
                  <li
                    key={house.house_id}
                    className="bg-gray-700 p-4 rounded-lg shadow-md"
                  >
                    <div>
                      <p className="text-lg font-medium">
                        House ID: {house.house_id}
                      </p>
                      <p className="text-sm">
                        Last Visited: {house.last_visited_date || "N/A"}
                      </p>
                      <p className="text-sm">
                        Phone Number: {house.phone_number || "N/A"}
                      </p>
                      <p className="text-sm">
                        Time to Reach: {house.time_to_reach}
                      </p>
                      <p className="text-sm">Visit Date: {house.visit_date}</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-red-500">
                  No data found for selected house and date.
                </p>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
