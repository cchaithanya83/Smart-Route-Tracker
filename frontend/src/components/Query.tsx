import React, { useEffect, useState } from "react";
import axios from "axios";

interface Query {
  id: number;
  house_id: number;
  phone_number: string;
  query: string;
  status: string;
  created_at: string;
  image?: string; // Base64-encoded image
}

const QueryManagement = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/get-queries");
      console.log("API Response:", response.data);
      setQueries(response.data || []);
    } catch (error) {
      console.error("Error fetching queries:", error);
      setQueries([]);
    }
    setLoading(false);
  };

  const markAsDone = async (queryId: number) => {
    try {
      await axios.patch("http://127.0.0.1:8000/mark-query-done", {
        query_id: queryId,
      });
      setQueries((prevQueries) =>
        prevQueries.map((query) =>
          query.id === queryId ? { ...query, status: "done" } : query
        )
      );
    } catch (error) {
      console.error("Error marking query as done:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg max-w-3xl mx-auto content-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Query Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : Array.isArray(queries) && queries.length > 0 ? (
        <ul className="space-y-4">
          {queries.map((query) => (
            <li
              key={query.id}
              className="p-4 bg-gray-700 rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div className="flex flex-col space-y-2">
                <p className="font-semibold">
                  House ID: {query.house_id} | Phone: {query.phone_number}
                </p>
                <p className="italic">Query: {query.query}</p>
                {query.image && (
                  <img
                    src={`data:image/jpeg;base64,${query.image}`}
                    alt="Query Image"
                    className="mt-2 max-w-xs h-auto rounded"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/png;base64,${query.image}`;
                    }}
                  />
                )}
                <p
                  className={`mt-2 ${
                    query.status === "done"
                      ? "text-green-500"
                      : "text-yellow-400"
                  }`}
                >
                  Status: {query.status}
                </p>
                <p className="text-sm text-gray-400">
                  Created At: {query.created_at}
                </p>
              </div>
              {query.status !== "done" && (
                <button
                  className="mt-4 sm:mt-0 sm:ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 focus:outline-none"
                  onClick={() => markAsDone(query.id)}
                  disabled={loading}
                >
                  Mark as Done
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No queries found.</p>
      )}
    </div>
  );
};

export default QueryManagement;
