export const getPageNumbers = (currentPage, totalPages) => {
    const pageNumbers = [];
    if (totalPages <= 10) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        pageNumbers.push(1);
        if (currentPage > 4) {
            pageNumbers.push("...");
        }
        for (
            let i = Math.max(currentPage - 2, 2);
            i <= Math.min(currentPage + 2, totalPages - 1);
            i++
        ) {
            pageNumbers.push(i);
        }
        if (currentPage < totalPages - 3) {
            pageNumbers.push("...");
        }
        pageNumbers.push(totalPages);
    }
    return pageNumbers;
};
