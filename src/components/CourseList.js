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

const SLOW_LOADING_MS = 3000;
const SKELETON_ROWS = 8;
const SKELETON_NAME_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-2/5"];

const Bar = ({ className }) => (
  <div className={`h-3 rounded-full bg-gray-200 dark:bg-gray-700 ${className}`} />
);

// Placeholder rows shown in a <tfoot> during the first load: they line up with the real columns,
// while scripts reading the rows of the <tbody> (Dashboard+) ignore them.
const TableSkeleton = ({ isSlow }) => (
  <tfoot className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <tr key={index} className="motion-safe:animate-pulse" aria-hidden="true">
        <td className="px-6 py-4 min-w-64">
          <Bar className={SKELETON_NAME_WIDTHS[index % SKELETON_NAME_WIDTHS.length]} />
        </td>
        <td className="px-2 py-3">
          <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </td>
        <td className="px-2 py-3">
          <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </td>
        <td className="px-6 py-4">
          <Bar className="w-28" />
        </td>
        <td className="px-6 py-4">
          <Bar className="w-24" />
        </td>
        <td className="px-6 py-4">
          <Bar className="w-12" />
        </td>
      </tr>
    ))}
    <tr>
      <td colSpan={6} className="px-6 py-4">
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span
            className="inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
            aria-hidden="true"
          />
          {isSlow
            ? "Premier chargement : la liste des sessions est en cours de préparation, cela peut prendre quelques secondes…"
            : "Chargement des sessions…"}
        </p>
      </td>
    </tr>
  </tfoot>
);

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

  const { data, error, isLoading, mutate } = useSWR(`${API_URL}?${params}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
  });

  // First load: nothing to show yet. Later loads: with keepPreviousData, the previous page
  // stays on screen while the next one loads.
  const isInitialLoading = isLoading && !data;
  const isFetching = isLoading && Boolean(data);

  // The first load can take a while when the server has to scan the BBB folders.
  const [isSlow, setIsSlow] = useState(false);
  useEffect(() => {
    if (!isInitialLoading) {
      setIsSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, [isInitialLoading]);
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

  if (error && !data)
    return (
      <div
        role="alert"
        className="mt-10 flex w-[calc(100vw-2rem)] max-w-xl flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
      >
        <p>
          <span className="font-semibold">Impossible de charger les sessions.</span> {error.message}
        </p>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          {isLoading && (
            <span
              className="inline-block size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
              aria-hidden="true"
            />
          )}
          {isLoading ? "Nouvelle tentative…" : "Réessayer"}
        </button>
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
        aria-busy={isLoading}
      >
        {isFetching && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/4 bg-blue-500 motion-safe:animate-progress-indeterminate" />
          </div>
        )}
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
          {/* The table and its empty <tbody> are rendered from the start, so that scripts
              watching the rows (Dashboard+) find them. */}
          {isInitialLoading && <TableSkeleton isSlow={isSlow} />}
        </table>
      </div>
      {data && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          startIndex={startIndex}
          pageItemCount={currentItems.length}
          totalItems={totalItems}
        />
      )}
    </>
  );
}
