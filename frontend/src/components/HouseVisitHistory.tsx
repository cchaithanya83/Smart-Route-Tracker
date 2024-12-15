import React, { useState, useEffect } from "react";
import axios from "axios";

interface HouseVisit {
  house_id: number;
  last_visited_date: string;
}

const HouseVisitHistory: React.FC = () => {
  const [visits, setVisits] = useState<HouseVisit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate an API call to get the visit data (you can replace this with an actual API call)
    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/get-last-visited-date"
        ); // Replace with your actual API endpoint
        setVisits(response.data);
      } catch (error) {
        console.error("Error fetching visit data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  const renderVisitDate = (house_id: number) => {
    const visit = visits.find((visit) => visit.house_id === house_id);
    return visit ? visit.last_visited_date : "Not Visited";
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">House Visit History</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full table-auto bg-gray-700 text-white rounded">
          <thead>
            <tr>
              <th className="p-2 border-b">House ID</th>
              <th className="p-2 border-b">Last Visited Date</th>
            </tr>
          </thead>
          <tbody>
            {/* Display house data for house_id 1 to 100 */}
            {Array.from({ length: 100 }, (_, index) => index + 1).map(
              (house_id) => (
                <tr key={house_id}>
                  <td className="p-2 border-b">{house_id}</td>
                  <td className="p-2 border-b">{renderVisitDate(house_id)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HouseVisitHistory;
