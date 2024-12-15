import React, { useState } from "react";
import axios from "axios";

interface DayDetails {
  day: string;
  is_holiday: number;
  weather: string;
  date: string;
  truck_capacity: number; // Add truck capacity to the interface
}

const OptimalRouteForm: React.FC = () => {
  const [form, setForm] = useState<DayDetails>({
    day: "Monday",
    is_holiday: 0,
    weather: "Sunny",
    date: "",
    truck_capacity: 100, // Default truck capacity set to 100
  });
  const [route, setRoute] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/get-optimal-route",
        form
      );
      setRoute(response.data.optimal_route);
    } catch (err) {
      setError("Failed to fetch the optimal route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-md mx-auto content-center justify-center ">
      <h1 className="text-2xl font-bold mb-4">Get Optimal Route</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm">Day</label>
          <select
            name="day"
            value={form.day}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Is Holiday</label>
          <select
            name="is_holiday"
            value={form.is_holiday}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Weather</label>
          <select
            name="weather"
            value={form.weather}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            {["Sunny", "Rainy", "Cloudy"].map((weather) => (
              <option key={weather} value={weather}>
                {weather}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block text-sm">Truck Capacity</label>
          <input
            type="number"
            name="truck_capacity"
            value={form.truck_capacity}
            onChange={handleChange}
            min="0"
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <button
          onClick={fetchRoute}
          disabled={loading}
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          {loading ? "Loading..." : "Get Route"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {route && (
          <div>
            <h2 className="text-lg font-semibold mt-4">Optimal Route:</h2>
            <p>{route.join(" -> ")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimalRouteForm;
