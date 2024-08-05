// Loading animation
const shimmer =
  "animate-pulse bg-gray-100 dark:bg-gray-800 dark:bg-opacity-50 rounded-lg overflow-hidden shadow-md sm:rounded-lg";

export function CourseListSkeleton() {
  return (
    <div
      className={`${shimmer} mt-3 relative overflow-x-auto shadow-md sm:rounded-lg`}
    >
      <table className="table-auto w-full border-collapse text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3 min-w-10">
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
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
          <CourseLine />
        </tbody>
      </table>
    </div>
  );
}

function CourseLine() {
  return (
    <tr
      key="skeleton-1"
      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      <td
        scope="row"
        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-baseline"
      >
        <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-96 mb-4"></div>
      </td>
      <td>
        <button
          className="text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-4 focus:ring-gray-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-400 focus:outline-none dark:focus:ring-gray-800"
          disabled
        >
          Dashboard
        </button>
      </td>
      <td>
        <button
          className="text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-4 focus:ring-gray-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-400 focus:outline-none dark:focus:ring-gray-800"
          disabled
        >
          Replay
        </button>
      </td>
      <td>
        <button
          className="text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-4 focus:ring-gray-300 font-medium ml-2 rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-400 focus:outline-none dark:focus:ring-gray-800"
          disabled
        >
          Messages
        </button>
      </td>
      <td className="px-6 py-4 font-bold">
        <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
      </td>
      <td className="px-6 py-4 font-bold">
        <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
      </td>
    </tr>
  );
}
