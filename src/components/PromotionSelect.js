import React from "react";

const PromotionSelect = ({ selectedPromotion, setSelectedPromotion, uniquePromotions, capitalizeFirstLetter }) => {
    return (
        <form className="max-w-sm mx-auto">
            <select
                id="promotions"
                className="block w-100 p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={selectedPromotion}
                onChange={(e) => {
                    setSelectedPromotion(e.target.value);
                }}
            >
                <option value="">Promotions</option>
                {uniquePromotions.map((promotion, index) => (
                    <option key={index} value={promotion}>
                        {capitalizeFirstLetter(promotion)}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">
                <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M11.293 7.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1-1.414 1.414L12 9.414l-3.293 3.293a 1 1 0 1 1-1.414-1.414l4-4z"
                    />
                </svg>
            </div>
        </form>
    );
};

export default PromotionSelect;
