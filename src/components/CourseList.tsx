"use client";
import useSWR from "swr";
import convertUnixTimeStamp from "@/utils/convertUnixTimestamp";
import { differenceInDays } from "date-fns";
import { CourseListSkeleton } from "./CourseListSkeleton";

interface Course {
  id: string;
  name: string;
  creationDate: number;
  endDate: number;
  dashboardUrl: string;
  replayUrl: string;
  presentationUrl: string;
}
interface Courses extends Array<Course> {}

export default function CourseList() {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, error } = useSWR(
    "/dashboards/api/generate-courses-list",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: false,
    }
  );

  const sortData = (data: Courses) => {
    return data
      ? [...data].sort((a, b) =>
          differenceInDays(new Date(a.creationDate), new Date(b.creationDate))
        )
      : [];
  };

  const sortedData = sortData(data);

  if (!data) return <CourseListSkeleton />;
  if (error) return <div>Failed to load</div>;
  return (
    <div className="mt-3 relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full border-collapse text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Nom de la session
            </th>
            <th scope="col" className="px-6 py-3"></th>
            <th scope="col" className="px-6 py-3"></th>
            <th scope="col" className="px-6 py-3"></th>
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
              <td
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                {course.name}
              </td>
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
              <td>
                {course.presentationUrl ? (
                  <a
                    className="text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 focus:ring-amber-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-amber-600 dark:hover:bg-amber-700 focus:outline-none dark:focus:ring-amber-800"
                    href={course.presentationUrl}
                  >
                    Messages
                  </a>
                ) : (
                  <button
                    className="text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-4 focus:ring-gray-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-400 focus:outline-none dark:focus:ring-gray-800"
                    disabled
                  >
                    Messages
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
  );
}