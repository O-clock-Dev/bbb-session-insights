"use client";
import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import PromotionSelect from "@/components/PromotionSelect";
import Pagination from "@/components/Pagination";
import convertUnixTimeStamp from "@/utils/convertUnixTimestamp";

const ITEMS_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const API_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/generate-courses-list`;

const fetcher = async (url) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
};

export default function CourseList() {
  const [selectedPromotion, setSelectedPromotion] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // Only query the API once the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const params = new URLSearchParams({
    page: String(currentPage),
    limit: String(ITEMS_PER_PAGE),
  });
  if (selectedPromotion) params.set("promotion", selectedPromotion);
  if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
  if (sortConfig.key) {
    params.set("sort", sortConfig.key);
    params.set("order", sortConfig.direction);
  }

  const { data, error, isLoading } = useSWR(`${API_URL}?${params}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
  });

  const promotions = data?.promotions ?? [];
  const currentItems = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startIndex = ((data?.page ?? currentPage) - 1) * ITEMS_PER_PAGE;

  const tableRef = useRef(null);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // The pagination sits below the table: bring the top of the new page into view.
    if (tableRef.current?.getBoundingClientRect().top < 0) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  if (error) return <div>Impossible de charger les sessions : {error.message}</div>;
  if (isLoading && !data)
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
          promotions={promotions}
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
      <div ref={tableRef} className="mt-3 relative overflow-x-auto shadow-md sm:rounded-lg scroll-mt-4">
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
        onPageChange={handlePageChange}
        startIndex={startIndex}
        pageItemCount={currentItems.length}
        totalItems={totalItems}
      />
    </>
  );
}
