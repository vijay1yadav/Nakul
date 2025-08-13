import React from 'react';
import { FaLightbulb } from 'react-icons/fa';

const RecommendationsSection = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaLightbulb className="mr-2 text-blue-600" /> Optimization Recommendations
            </h2>
            <p>Coming soon in the next version!</p>
        </div>
    );
};

export default RecommendationsSection;