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
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [userQuery, setUserQuery] = useState<string>("");
  // New states for waste request
  const [isRequestingWaste, setIsRequestingWaste] = useState<boolean>(false);
  const [wasteRequestDate, setWasteRequestDate] = useState<string>("");
  const [wasteDescription, setWasteDescription] = useState<string>("");

  const houseNumberOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getHouseVisitInfo = async (houseId: number) => {
    const today = getTodaysDate();
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/get-visit-info?date=${today}&house_id=${houseId}`
      );
      const visitInfo = response.data[0];
      setHouseInfo(visitInfo);
      setPhoneNumber(visitInfo.phone_number || null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visit info:", error);
      setLoading(false);
    }
  };

  const handleHouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const houseId = Number(e.target.value);
    setSelectedHouseId(houseId);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserQuery(e.target.value);
  };

  // New handlers for waste request
  const handleWasteDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWasteRequestDate(e.target.value);
  };

  const handleWasteDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setWasteDescription(e.target.value);
  };

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
        setIsEditing(false);
        getHouseVisitInfo(selectedHouseId);
      } catch (error) {
        console.error("Error updating phone number:", error);
      }
    }
  };

  const submitQuery = async () => {
    if (userQuery.trim() && selectedHouseId && phoneNumber) {
      try {
        await axios.post(
          "http://localhost:8000/add-query",
          {
            house_id: selectedHouseId,
            phone_number: phoneNumber,
            query: userQuery,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert("Query submitted successfully!");
        setUserQuery("");
        setIsQuerying(false);
      } catch (error) {
        console.error("Error submitting query:", error);
      }
    } else {
      alert("Please fill in all fields.");
    }
  };

  // New function to submit waste request
  const submitWasteRequest = async () => {
    if (wasteRequestDate && wasteDescription.trim() && selectedHouseId) {
      try {
        await axios.post(
          "http://localhost:8000/request-extra-waste-pickup",
          {
            house_id: selectedHouseId,
            date: wasteRequestDate,
            description: wasteDescription,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert("Extra waste pickup request submitted successfully!");
        setWasteRequestDate("");
        setWasteDescription("");
        setIsRequestingWaste(false);
      } catch (error) {
        console.error("Error submitting waste request:", error);
        alert("Failed to submit waste request. Please try again.");
      }
    } else {
      alert("Please fill in both date and description.");
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

        {/* Action Buttons Section */}
        <div className="mt-6 space-y-4">
          {/* Raise Query Section */}
          {!isQuerying ? (
            <button
              onClick={() => setIsQuerying(true)}
              className="bg-green-500 text-white p-2 rounded-md w-full"
            >
              Raise Query
            </button>
          ) : (
            <div className="mt-4">
              <textarea
                placeholder="Type your query (1-200 words)..."
                value={userQuery}
                onChange={handleQueryChange}
                className="p-2 w-full h-32 border bg-gray-800 text-white rounded-md"
              ></textarea>
              <button
                onClick={submitQuery}
                className="mt-4 bg-blue-500 text-white p-2 rounded-md w-full"
              >
                Submit Query
              </button>
              <button
                onClick={() => setIsQuerying(false)}
                className="mt-2 bg-red-500 text-White p-2 rounded-md w-full"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Request Extra Waste Pickup Section */}
          {!isRequestingWaste ? (
            <button
              onClick={() => setIsRequestingWaste(true)}
              className="bg-purple-500 text-white p-2 rounded-md w-full"
            >
              Request Extra Waste Pickup
            </button>
          ) : (
            <div className="mt-4">
              <label htmlFor="wasteDate" className="block text-sm font-medium mb-2">
                Pickup Date:
              </label>
              <input
                id="wasteDate"
                type="date"
                value={wasteRequestDate}
                onChange={handleWasteDateChange}
                min={getTodaysDate()}
                className="p-2 w-full border bg-gray-800 text-white rounded-md mb-4"
              />
              <label
                htmlFor="wasteDescription"
                className="block text-sm font-medium mb-2"
              >
                Description:
              </label>
              <textarea
                id="wasteDescription"
                placeholder="Describe the extra waste (e.g., type, quantity)"
                value={wasteDescription}
                onChange={handleWasteDescriptionChange}
                className="p-2 w-full h-24 border bg-gray-800 text-white rounded-md"
              ></textarea>
              <button
                onClick={submitWasteRequest}
                className="mt-4 bg-blue-500 text-white p-2 rounded-md w-full"
              >
                Submit Waste Request
              </button>
              <button
                onClick={() => setIsRequestingWaste(false)}
                className="mt-2 bg-red-500 text-white p-2 rounded-md w-full"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;