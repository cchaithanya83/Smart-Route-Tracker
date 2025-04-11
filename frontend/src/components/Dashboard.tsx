import React, { useState, useEffect } from "react";
import axios from "axios";

interface VisitHistoryResponse {
  date: string;
  house_ids: number[];
}

interface HouseWithTime {
  house_id: number;
  last_visited_date: string | null;
  time_to_reach: string;
  phone_number: string | null;
}

interface WasteRequest {
  id: number;
  house_id: number;
  date: string;
  description: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [houses, setHouses] = useState<HouseWithTime[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Cache to store distances between houses to reduce API calls
  const distanceCache: { [key: string]: number } = {};

  const getVisitHistory = async (date: string) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/get-visit-history?date=${date}`
      );

      console.log("API Response: ", response.data);

      const housesData = response.data;

      const allHouses: HouseWithTime[] = [];

      for (let visit of housesData) {
        console.log(`Processing visit for date: ${visit.date}`, visit);

        for (let house of visit.houses) {
          allHouses.push({
            house_id: house.house_id,
            last_visited_date: house.last_visited_date,
            phone_number: house.phone_number,
            time_to_reach: "",
          });
        }
      }

      return allHouses;
    } catch (error) {
      console.error("Error fetching visit history:", error);
    }
  };

  const fetchWasteRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await axios.get(
        "http://localhost:8000/get-waste-requests"
      );
      setWasteRequests(response.data);
      setLoadingRequests(false);
    } catch (error) {
      console.error("Error fetching waste requests:", error);
      setLoadingRequests(false);
    }
  };

  const fetchDistance = async (
    houseId1: number,
    houseId2: number
  ): Promise<number> => {
    const cacheKey = `${houseId1}-${houseId2}`;

    if (distanceCache[cacheKey] !== undefined) {
      return distanceCache[cacheKey];
    }

    try {
      const response = await axios.get(
        `http://localhost:8000/get-distance?house1=${houseId1}&house2=${houseId2}`
      );
      const distance = response.data.distance;

      distanceCache[cacheKey] = distance;

      return distance;
    } catch (error) {
      console.error(
        `Error fetching distance between ${houseId1} and ${houseId2}:`,
        error
      );
      return 0;
    }
  };

  const getExpectedTimeToReach = (
    previousTime: Date,
    distance: number
  ): Date => {
    const speed = 50; // Speed in km/h
    const timeInHours = distance / speed;
    const timeInMilliseconds = timeInHours * 60 * 60 * 1000;
    const newTime = new Date(previousTime.getTime() + timeInMilliseconds);
    return newTime;
  };

  const updateVisitTime = async (houseId: number) => {
    try {
      await axios.post("http://localhost:8000/update-visit-time", {
        house_id: houseId,
      });
      alert(`Visit time updated for house ${houseId}`);
    } catch (error) {
      console.error("Error updating visit time:", error);
      alert("Failed to send SMS");
    }
  };

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      getVisitHistory(selectedDate).then(async (housesData) => {
        if (housesData) {
          let currentTime = new Date();
          currentTime.setHours(10, 0, 0, 0); // 10 AM

          const housesWithDetails: HouseWithTime[] = [];
          for (let i = 0; i < housesData.length; i++) {
            const house = housesData[i];

            if (i > 0) {
              const distance = await fetchDistance(
                housesData[i - 1].house_id,
                house.house_id
              );

              currentTime = getExpectedTimeToReach(currentTime, distance);
            }

            housesWithDetails.push({
              ...house,
              last_visited_date: house.last_visited_date,
              phone_number: house.phone_number,
              time_to_reach: currentTime.toLocaleTimeString(),
            });
          }

          setHouses(housesWithDetails);
        }
        setLoading(false);
      });
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchWasteRequests();
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-900">
      {/* Sidebar for Waste Requests */}
      <div className="w-1/4 bg-gray-800 p-6 rounded-lg shadow-lg text-white">
        <h2 className="text-2xl font-semibold mb-4">Extra Waste Requests</h2>
        {loadingRequests ? (
          <p className="text-center text-blue-500">Loading...</p>
        ) : wasteRequests.length === 0 ? (
          <p className="text-center text-gray-400">No requests found.</p>
        ) : (
          <ul className="space-y-4">
            {wasteRequests.map((request) => (
              <li
                key={request.id}
                className="bg-gray-700 p-4 rounded-lg shadow-md"
              >
                <p className="text-lg font-medium">House {request.house_id}</p>
                <p className="text-sm">Date: {request.date}</p>
                <p className="text-sm">Description: {request.description}</p>
                <p className="text-sm">Status: {request.status}</p>
                <p className="text-sm">
                  Created: {new Date(request.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 p-6">
        <div className="container mx-auto w-full p-10 bg-gray-800 rounded-lg shadow-lg text-white">
          <h1 className="text-3xl font-semibold mb-4 text-center">
            Waste Management Dashboard
          </h1>
          <div className="my-4">
            <label htmlFor="date" className="block text-lg font-medium mb-2">
              Select Date:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 w-full border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {loading ? (
            <p className="text-center text-blue-500">Loading...</p>
          ) : (
            <div className="mt-6">
              <h2 className="text-2xl font-medium mb-4 text-center">
                House Visits on {selectedDate}
              </h2>
              <ul className="space-y-4">
                {houses.map((house) => (
                  <li
                    key={house.house_id}
                    className="bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between"
                  >
                    <div>
                      <p className="text-lg font-medium">
                        House {house.house_id}
                      </p>
                      <p className="text-sm">
                        Last Visited: {house.last_visited_date || "N/A"}
                      </p>
                      <p className="text-sm">
                        Time to Reach: {house.time_to_reach}
                      </p>
                      <p className="text-sm">
                        Phone Number: {house.phone_number || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => updateVisitTime(house.house_id)}
                      className="mt-4 ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                      Send SMS
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
