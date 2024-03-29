"use client";
import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());
import convertUnixTimeStamp from "@/utils/convertUnixTimestamp";

export default function CourseList() {
  const { data, error } = useSWR("dashboards/api/generate-courses-list", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
  });

  const sortData = (data) => {
    return data ? [...data].sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)) : [];
  };

  const sortedData = sortData(data);

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
    <div className="mt-3 relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Session
            </th>
            <th scope="col" className="px-6 py-3">
              Date de création
            </th>
            <th scope="col" className="px-6 py-3">
              Date de fin
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((course) => (
            <tr
              key={course.id}
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                <a
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                  href={course.url}
                >
                  {course.name}
                </a>
              </th>
              <td className="px-6 py-4">{convertUnixTimeStamp(course.creationDate)}</td>
              <td className="px-6 py-4">{convertUnixTimeStamp(course.endDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
