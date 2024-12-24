import React, { useState, useEffect } from "react";
import axios from "axios";

// Interface for the visit info data based on the provided structure
interface HouseVisitInfo {
  house_id: number;
  last_visited_date: string;
  phone_number: string | null;
  is_scheduled_today: boolean;
}

const UserDashboard: React.FC = () => {
  const [selectedHouseId, setSelectedHouseId] = useState<number>(0);
  const [houseInfo, setHouseInfo] = useState<HouseVisitInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null); // For displaying/editing phone number
  const [isEditing, setIsEditing] = useState<boolean>(false); // For tracking phone number edit mode

  // Generate house number options 1-100
  const houseNumberOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  // Get today's date in YYYY-MM-DD format
  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Fetching house visit information based on houseId and today's date
  const getHouseVisitInfo = async (houseId: number) => {
    const today = getTodaysDate();
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/get-visit-info?date=${today}&house_id=${houseId}`
      );
      const visitInfo = response.data[0]; // Assuming it returns an array with one object
      setHouseInfo(visitInfo);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visit info:", error);
      setLoading(false);
    }
  };

  // Handle house number change
  const handleHouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const houseId = Number(e.target.value);
    setSelectedHouseId(houseId);
  };

  // Handle phone number change (for editing)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  // Submit the updated phone number
  const updatePhoneNumber = async () => {
    if (phoneNumber && selectedHouseId) {
      try {
        await axios.post(
          "http://localhost:8000/set-phone-number",
          {
            house_id: selectedHouseId,
            phone_number: phoneNumber,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setIsEditing(false); // Disable editing mode after update
        getHouseVisitInfo(selectedHouseId); // Refresh the data
      } catch (error) {
        console.error("Error updating phone number:", error);
      }
    }
  };

  useEffect(() => {
    if (selectedHouseId) {
      getHouseVisitInfo(selectedHouseId);
    }
  }, [selectedHouseId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto p-6 w-full max-w-lg bg-gray-800 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          User Dashboard - House Visit Info
        </h1>

        {/* House Number Range Selection */}
        <div className="my-4">
          <label htmlFor="house" className="block text-lg font-medium mb-2">
            Select House Number:
          </label>
          <select
            id="house"
            value={selectedHouseId || ""}
            onChange={handleHouseChange}
            className="p-2 w-full border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-600"
          >
            <option value="" disabled>
              Select House Number
            </option>
            {houseNumberOptions.map((num) => (
              <option key={num} value={num}>
                House {num}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-blue-500">Loading...</p>
        ) : (
          houseInfo && (
            <div className="mt-6">
              <h2 className="text-2xl font-medium mb-4 text-center">
                Details for House {selectedHouseId} on {getTodaysDate()}
              </h2>
              <div className="bg-gray-700 p-6 rounded-lg shadow-md">
                <p className="text-lg font-medium">
                  House ID: {houseInfo.house_id}
                </p>
                <p className="text-sm">
                  Last Visited: {houseInfo.last_visited_date}
                </p>
                <p className="text-sm">
                  Phone Number:{" "}
                  {isEditing ? (
                    <input
                      type="text"
                      value={phoneNumber || houseInfo.phone_number || ""}
                      onChange={handlePhoneChange}
                      className="p-2 border bg-gray-800 text-white rounded-md w-full mt-2"
                    />
                  ) : (
                    houseInfo.phone_number || "N/A"
                  )}
                </p>
                <p className="text-sm">
                  Scheduled Today: {houseInfo.is_scheduled_today ? "Yes" : "No"}
                </p>
                {isEditing ? (
                  <button
                    onClick={updatePhoneNumber}
                    className="mt-4 bg-blue-500 text-white p-2 rounded-md"
                  >
                    Save Phone Number
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 bg-yellow-500 text-white p-2 rounded-md"
                  >
                    Edit Phone Number
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
