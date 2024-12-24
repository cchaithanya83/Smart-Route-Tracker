import React, { useState } from "react";
import axios from "axios";

interface Visit {
  house_id: number;
  start_time: string;
  end_time: string | null;
}

const HouseVisitTracker: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [currentHouse, setCurrentHouse] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const startVisit = (house_id: number) => {
    const startTime = new Date().toISOString();
    setCurrentHouse(house_id);
    setIsTracking(true);
    setVisits((prev) => [
      ...prev,
      { house_id, start_time: startTime, end_time: null },
    ]);
  };

  const endVisit = async () => {
    if (!currentHouse) return;

    const endTime = new Date().toISOString();
    setVisits((prev) =>
      prev.map((visit) =>
        visit.house_id === currentHouse
          ? { ...visit, end_time: endTime }
          : visit
      )
    );

    setIsTracking(false);

    // Simulate sending SMS
    try {
      await axios.post("http://127.0.0.1:8000/send-sms", {
        house_id: currentHouse,
        end_time: endTime,
      });
      alert("SMS sent successfully!");
    } catch (error) {
      console.error("Error sending SMS", error);
    }

    setCurrentHouse(null);
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">House Visit Tracker</h1>
      <div className="space-y-4">
        {!isTracking ? (
          <button
            onClick={() => startVisit(Math.floor(Math.random() * 100) + 1)} // Simulate random house ID
            className="bg-blue-500 px-4 py-2 rounded shadow text-white"
          >
            Start Visit
          </button>
        ) : (
          <button
            onClick={endVisit}
            className="bg-red-500 px-4 py-2 rounded shadow text-white"
          >
            End Visit
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold mb-2">Visit History</h2>
          <ul>
            {visits.map((visit, index) => (
              <li key={index} className="mb-1">
                House {visit.house_id}: {visit.start_time} -{" "}
                {visit.end_time || "Ongoing"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HouseVisitTracker;
