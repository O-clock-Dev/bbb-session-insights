"use client";
import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import PromotionSelect from "@/components/PromotionSelect";
import Pagination from "@/components/Pagination";
import { dayOffset, formatDay, formatDuration, formatFull, formatTime } from "@/utils/dateFormat";

const ITEMS_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const API_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/generate-courses-list`;

const fetcher = async (url) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
};

const hasEnd = (course) => course.endDate >= course.creationDate;

const actionButton =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800";

const ChartIcon = () => (
  <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.1-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
  </svg>
);

const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;
  return (
    <th
      scope="col"
      className="px-6 py-3"
      aria-sort={direction ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-900 dark:hover:text-white ${
          isActive ? "text-gray-900 dark:text-white" : ""
        }`}
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition ${isActive ? "opacity-100" : "opacity-30 group-hover:opacity-70"} ${
            direction === "asc" ? "rotate-180" : ""
          }`}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </th>
  );
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

  // With keepPreviousData, the previous page stays on screen while the next one loads.
  const isFetching = isLoading && Boolean(data);
  const promotions = data?.promotions ?? [];
  const currentItems = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startIndex = ((data?.page ?? currentPage) - 1) * ITEMS_PER_PAGE;

  const hasFilters = Boolean(selectedPromotion || searchTerm);
  const resetFilters = () => {
    setSelectedPromotion("");
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

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
      {/* Toolbar: it must stay the first div right after the <hr>, where the Dashboard+ script adds its button. */}
      <div className="flex w-[calc(100vw-2rem)] max-w-6xl flex-col gap-3 text-base sm:flex-row sm:items-center">
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
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 shrink-0 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12" />
            </svg>
            Réinitialiser
          </button>
        )}
      </div>
      <div className="h-6" aria-hidden="true" />
      <div
        ref={tableRef}
        className={`relative w-[calc(100vw-2rem)] max-w-6xl overflow-x-auto rounded-xl border border-gray-200 shadow-sm scroll-mt-4 transition-opacity dark:border-gray-700 ${
          isFetching ? "opacity-60" : ""
        }`}
        aria-busy={isFetching}
      >
        {/* Keep the column order and the <th> holding the bare name: the Dashboard+ script
            served with the production page reads them. */}
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="text-xs font-semibold tracking-wide text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/60 dark:text-gray-400">
            <tr>
              <SortableHeader label="Session" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
              <th scope="col" className="px-2 py-3">
                <span className="sr-only">Tableau de bord</span>
              </th>
              <th scope="col" className="px-2 py-3">
                <span className="sr-only">Enregistrement</span>
              </th>
              <SortableHeader label="Date" sortKey="creationDate" sortConfig={sortConfig} onSort={requestSort} />
              <th scope="col" className="px-6 py-3">
                Horaires
              </th>
              <SortableHeader label="Durée" sortKey="duration" sortConfig={sortConfig} onSort={requestSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.map((course) => (
              <tr
                key={course.id}
                className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
              >
                <th
                  scope="row"
                  className="px-6 py-3 min-w-64 font-medium text-gray-900 dark:text-white"
                >
                  {course.name}
                </th>
                <td className="px-2 py-3 whitespace-nowrap">
                  <a
                    className={`${actionButton} text-white bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500`}
                    href={course.dashboardUrl}
                  >
                    <ChartIcon />
                    Dashboard
                  </a>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  {course.replayUrl ? (
                    <a
                      className={`${actionButton} text-white bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500`}
                      href={course.replayUrl}
                    >
                      <PlayIcon />
                      Replay
                    </a>
                  ) : (
                    <button
                      className={`${actionButton} text-gray-400 border border-dashed border-gray-300 cursor-not-allowed dark:text-gray-500 dark:border-gray-600`}
                      title="Pas d'enregistrement pour cette session"
                      disabled
                    >
                      <PlayIcon />
                      Replay
                    </button>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {formatDay(course.creationDate)}
                </td>
                {/* Some sessions have no end date (0), which used to show as 1 January 1970. */}
                {hasEnd(course) ? (
                  <>
                    <td
                      className="px-6 py-3 whitespace-nowrap tabular-nums"
                      title={`Du ${formatFull(course.creationDate)} au ${formatFull(course.endDate)}`}
                    >
                      {formatTime(course.creationDate)} – {formatTime(course.endDate)}
                      {dayOffset(course.creationDate, course.endDate) > 0 && (
                        <span className="ml-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          +{dayOffset(course.creationDate, course.endDate)} j
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap tabular-nums">
                      {formatDuration(course.creationDate, course.endDate)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 whitespace-nowrap tabular-nums" title="Fin inconnue">
                      {formatTime(course.creationDate)} – <span className="text-gray-400 dark:text-gray-500">?</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 dark:text-gray-500">—</td>
                  </>
                )}
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
