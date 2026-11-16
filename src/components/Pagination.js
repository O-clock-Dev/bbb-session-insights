import React from "react";
import { getPageNumbers } from "@/utils/stringsUtils";

const numberFormat = new Intl.NumberFormat("fr-FR");

const baseButton =
    "inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
const idleButton =
    "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white";
const disabledButton =
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-300";
const currentButton = "text-white bg-blue-600 border border-blue-600 dark:bg-blue-600 dark:border-blue-600";

const Chevron = ({ direction }) => (
    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
        />
    </svg>
);

const Pagination = ({ currentPage, totalPages, onPageChange, startIndex, pageItemCount, totalItems }) => {
    if (!totalItems) {
        return (
            <p className="pt-4 text-sm text-center text-gray-500 dark:text-gray-400">
                Aucune session ne correspond à ces critères.
            </p>
        );
    }

    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPages;

    return (
        <nav
            className="flex w-full flex-col items-center gap-3 pt-4 md:flex-row md:justify-between"
            aria-label="Pagination des sessions"
        >
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Sessions{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                    {numberFormat.format(startIndex + 1)}–{numberFormat.format(startIndex + pageItemCount)}
                </span>{" "}
                sur{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                    {numberFormat.format(totalItems)}
                </span>
            </p>

            {totalPages > 1 && (
                <ul className="flex items-center gap-1">
                    <li>
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={isFirst}
                            className={`${baseButton} ${idleButton} ${disabledButton} gap-1`}
                        >
                            <Chevron direction="left" />
                            <span className="hidden sm:inline">Précédent</span>
                        </button>
                    </li>

                    {/* On small screens, the page numbers make room for a compact indicator. */}
                    <li className="px-2 text-sm text-gray-500 sm:hidden dark:text-gray-400">
                        Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> /{" "}
                        {totalPages}
                    </li>

                    {getPageNumbers(currentPage, totalPages).map((page, index) =>
                        typeof page === "number" ? (
                            <li key={page} className="hidden sm:block">
                                <button
                                    type="button"
                                    onClick={() => onPageChange(page)}
                                    aria-current={page === currentPage ? "page" : undefined}
                                    aria-label={`Page ${page}`}
                                    className={`${baseButton} tabular-nums ${
                                        page === currentPage ? currentButton : idleButton
                                    }`}
                                >
                                    {page}
                                </button>
                            </li>
                        ) : (
                            <li
                                key={`ellipsis-${index}`}
                                className="hidden sm:flex items-center justify-center h-9 min-w-9 text-sm text-gray-400 dark:text-gray-500"
                                aria-hidden="true"
                            >
                                …
                            </li>
                        ),
                    )}

                    <li>
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={isLast}
                            className={`${baseButton} ${idleButton} ${disabledButton} gap-1`}
                        >
                            <span className="hidden sm:inline">Suivant</span>
                            <Chevron direction="right" />
                        </button>
                    </li>
                </ul>
            )}
        </nav>
    );
};

export default Pagination;
