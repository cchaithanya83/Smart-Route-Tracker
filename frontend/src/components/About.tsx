import React from "react";

const About = () => {
  return (
    <div className="p-8 bg-gray-800 text-white rounded-lg max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-extrabold mb-6 text-green-400">About Us</h1>
      <p className="text-lg leading-relaxed text-gray-300 mb-6">
        Waste segregation is essential to reduce pollution, promote recycling,
        and ensure safe waste disposal. It also protects the health and dignity
        of waste management workers by minimizing their exposure to hazardous
        materials and reducing the need for manual sorting.
      </p>

      <h2 className="text-2xl font-bold text-green-400 mb-4">
        How You Can Join Hands with Us!
      </h2>
      <ul className="list-disc list-inside text-gray-300 text-lg mb-6 space-y-2">
        <li>
          <strong>Segregate at Source:</strong> Separate wet, dry, and hazardous
          waste into clearly labeled bins.
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-green-400 mb-4">Need Help?</h2>
      <ul className="list-disc list-inside text-gray-300 text-lg space-y-2 mb-6">
        <li>Report issues through the website.</li>
        <li>Check collection schedules.</li>
      </ul>

      <div className="bg-gray-700 rounded p-6 text-center">
        <h3 className="text-xl font-semibold text-green-300 mb-2">Together,</h3>
        <p className="text-lg text-gray-200">
          we're building a cleaner, greener community!!!
        </p>
      </div>
    </div>
  );
};

export default About;
    