export const sortData = (data) => {
    return data
        ? [...data].sort(
            (a, b) => new Date(b.creationDate) - new Date(a.creationDate)
        )
        : [];
};

export const splitName = (course) => {
    return {
        id: course.id,
        promotion: course.name.split("-")[0],
        season: course.name.split("-")[1],
        name: course.name.split("-")[2],
    };
};

export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

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
