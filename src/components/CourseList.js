"use client";
import useSWR from "swr";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PromotionSelect from "@/components/PromotionSelect";
import Pagination from "@/components/Pagination";
import { sortData, splitName, capitalizeFirstLetter, getPageNumbers } from "@/utils/stringsUtils";
const fetcher = (...args) => fetch(...args).then((res) => res.json());
import convertUnixTimeStamp from "@/utils/convertUnixTimestamp";

export default function CourseList() {
  const [selectedPromotion, setSelectedPromotion] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/generate-courses-list`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: false,
    }
  );

  const sortedData = sortData(data);

  const sortedDataPromo = sortedData?.map((course) => splitName(course));
  const uniquePromotions = [
    ...new Set(
      sortedDataPromo
        .map((course) => course.promotion.trim().toLowerCase())
        .filter((promotion) => !promotion.includes("'s room"))
        .filter((promotion) => !promotion.includes(" "))
    ),
  ].sort();

  const filteredData = sortedData
    .filter((course) =>
      selectedPromotion
        ? course.name.toLowerCase().includes(selectedPromotion.toLowerCase())
        : true
    )
    .filter((course) =>
      searchTerm
        ? course.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  const sortedFilteredData = filteredData.sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
    }
    return 0;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedFilteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalPages = Math.ceil(sortedFilteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (error) return <div>Failed to load</div>;
  if (!sortedData)
    return (
      <div
        className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );

  return (
    <>
      <hr className="w-48 h-1 mx-auto my-4 bg-gray-100 border-0 rounded md:my-10 dark:bg-gray-700" />
      <div className="flex items-center space-x-4">
        <PromotionSelect
          selectedPromotion={selectedPromotion}
          setSelectedPromotion={(value) => {
            setSelectedPromotion(value);
            setCurrentPage(1);
          }}
          uniquePromotions={uniquePromotions}
          capitalizeFirstLetter={capitalizeFirstLetter}
        />
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>
      <hr className="w-48 h-1 mx-auto my-4 bg-gray-100 border-0 rounded md:my-10 dark:bg-gray-700" />
      <div className="mt-3 relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full border-collapse text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 cursor-pointer"
                onClick={() => requestSort("name")}
              >
                Nom de la session
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? " ▲" : " ▼"
                ) : null}
              </th>
              <th scope="col" className="px-6 py-3"></th>
              <th scope="col" className="px-6 py-3"></th>
              <th
                scope="col"
                className="px-6 py-3 cursor-pointer"
                onClick={() => requestSort("creationDate")}
              >
                Date de création
                {sortConfig.key === "creationDate" ? (
                  sortConfig.direction === "asc" ? " ▲" : " ▼"
                ) : null}
              </th>
              <th
                scope="col"
                className="px-6 py-3 cursor-pointer"
                onClick={() => requestSort("endDate")}
              >
                Date de fin
                {sortConfig.key === "endDate" ? (
                  sortConfig.direction === "asc" ? " ▲" : " ▼"
                ) : null}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((course) => (
              <tr
                key={course.id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {course.name}
                </th>
                <td>
                  <a
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    href={course.dashboardUrl}
                  >
                    Dashboard
                  </a>
                </td>
                <td>
                  {course.replayUrl ? (
                    <a
                      className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
                      href={course.replayUrl}
                    >
                      Replay
                    </a>
                  ) : (
                    <button
                      className="text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-4 focus:ring-gray-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-400 focus:outline-none dark:focus:ring-gray-800"
                      disabled
                    >
                      Replay
                    </button>
                  )}
                </td>

                <td className="px-6 py-4 font-bold">
                  {convertUnixTimeStamp(course.creationDate)}
                </td>
                <td className="px-6 py-4 font-bold">
                  {convertUnixTimeStamp(course.endDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        getPageNumbers={() => getPageNumbers(currentPage, totalPages)}
        startIndex={startIndex}
        currentItemsLength={currentItems.length}
        totalItems={sortedFilteredData.length}
      />
    </>
  );
}
