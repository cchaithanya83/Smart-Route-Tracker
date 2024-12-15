import React, { useEffect, useState } from "react";
import axios from "axios";

interface Visit {
  date: string;
  house_ids: number[];
}

const VisitHistory: React.FC = () => {
  const [history, setHistory] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/get-visit-history-all"
        );
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-md mx-auto content-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Visit History</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-4">
          {history.map((visit, index) => (
            <li key={index} className="p-4 bg-gray-700 rounded">
              <p className="font-semibold">Date: {visit.date}</p>
              <p className="mt-2">House IDs:</p>
              <ul className="ml-4 list-disc list-inside">
                {visit.house_ids.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VisitHistory;
