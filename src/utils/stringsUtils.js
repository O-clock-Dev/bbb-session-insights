// Pages to show around the current one, always 7 slots once there are more than 7 pages
// so that the pagination keeps the same width: 1 … 4 5 6 … 183, 1 2 3 4 5 … 183.
// "…" marks the skipped pages.
const PAGE_SLOTS = 7;

export const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= PAGE_SLOTS) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "…", totalPages];
    }
    if (currentPage >= totalPages - 3) {
        return [1, "…", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
    }
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
};
