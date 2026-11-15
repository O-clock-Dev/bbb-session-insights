import React from "react";

const renderOption = (promotion) => (
    <option key={promotion.value} value={promotion.value}>
        {promotion.label} ({promotion.count})
    </option>
);

const PromotionSelect = ({ selectedPromotion, setSelectedPromotion, promotions }) => {
    const isActive = Boolean(selectedPromotion);
    return (
        <form className="relative w-full sm:w-72 shrink-0" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="promotions" className="sr-only">
                Promotion
            </label>
            <svg
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400"
                }`}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                />
            </svg>
            <select
                id="promotions"
                className={`block w-full h-10 pl-9 pr-9 text-sm rounded-lg border appearance-none cursor-pointer transition-colors bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500 ${
                    isActive ? "border-blue-500 dark:border-blue-500" : "border-gray-300 dark:border-gray-700"
                }`}
                value={selectedPromotion}
                onChange={(e) => {
                    setSelectedPromotion(e.target.value);
                }}
            >
                <option value="">Toutes les promotions</option>
                <optgroup label="Promotions">
                    {promotions.filter((promotion) => !promotion.isGroup).map(renderOption)}
                </optgroup>
                <optgroup label="Sessions hors promotion">
                    {promotions.filter((promotion) => promotion.isGroup).map(renderOption)}
                </optgroup>
            </select>
            <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
            </svg>
        </form>
    );
};

export default PromotionSelect;
