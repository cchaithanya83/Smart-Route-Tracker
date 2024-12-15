import React, { useState, useEffect } from "react";
import axios from "axios";

interface VisitHistoryResponse {
  date: string;
  house_ids: number[];
}

interface HouseWithTime {
  house_id: number;
  last_visited_date: string | null;
  time_to_reach: string; // String format for easy display
  phone_number: string | null;
}

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [houses, setHouses] = useState<HouseWithTime[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Cache to store distances between houses to reduce API calls
  const distanceCache: { [key: string]: number } = {};

  const getVisitHistory = async (date: string) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/get-visit-history?date=${date}`
      );

      console.log("API Response: ", response.data); // Inspect API response

      const housesData = response.data; // Extract data

      const allHouses: HouseWithTime[] = [];

      // Iterate through each visit record
      for (let visit of housesData) {
        console.log(`Processing visit for date: ${visit.date}`, visit);

        // Iterate through each house in the houses array
        for (let house of visit.houses) {
          // Push house information to allHouses array
          allHouses.push({
            house_id: house.house_id,
            last_visited_date: house.last_visited_date,
            phone_number: house.phone_number,
            time_to_reach: "", // You may calculate time later
          });
        }
      }

      return allHouses;
    } catch (error) {
      console.error("Error fetching visit history:", error);
    }
  };

  const fetchDistance = async (
    houseId1: number,
    houseId2: number
  ): Promise<number> => {
    const cacheKey = `${houseId1}-${houseId2}`;

    // Check if distance is already cached
    if (distanceCache[cacheKey] !== undefined) {
      return distanceCache[cacheKey];
    }

    try {
      const response = await axios.get(
        `http://localhost:8000/get-distance?house1=${houseId1}&house2=${houseId2}`
      );
      const distance = response.data.distance;

      // Cache the distance for future use
      distanceCache[cacheKey] = distance;

      return distance;
    } catch (error) {
      console.error(
        `Error fetching distance between ${houseId1} and ${houseId2}:`,
        error
      );
      return 0; // Default to 0 if the API call fails
    }
  };

  const getExpectedTimeToReach = (
    previousTime: Date,
    distance: number
  ): Date => {
    const speed = 50; // Speed in km/h
    const timeInHours = distance / speed;
    const timeInMilliseconds = timeInHours * 60 * 60 * 1000; // Convert to milliseconds
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
          // Assume starting time is 10:00 AM
          let currentTime = new Date();
          currentTime.setHours(10, 0, 0, 0); // 10 AM

          const housesWithDetails: HouseWithTime[] = [];
          for (let i = 0; i < housesData.length; i++) {
            const house = housesData[i];

            // If not the first house, calculate time_to_reach based on previous house
            if (i > 0) {
              const distance = await fetchDistance(
                housesData[i - 1].house_id,
                house.house_id
              );

              currentTime = getExpectedTimeToReach(currentTime, distance);
            }

            // Add the house details including visit and contact info
            housesWithDetails.push({
              ...house, // Spread original house properties (house_id, last_visited_date, etc.)
              last_visited_date: house.last_visited_date, // Use house object directly
              phone_number: house.phone_number, // Access phone_number directly from house
              time_to_reach: currentTime.toLocaleTimeString(), // Add calculated time
            });
          }

          setHouses(housesWithDetails);
        }
        setLoading(false);
      });
    }
  }, [selectedDate]);

  return (
    <div className=" min-h-screen flex items-center justify-center">
      <div className="container mx-auto p-6 w-full max-w-lg bg-gray-800 rounded-lg shadow-lg text-white">
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
  );
};

export default Dashboard;
