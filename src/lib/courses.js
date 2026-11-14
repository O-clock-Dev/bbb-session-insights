import fs from "node:fs/promises";
import { join } from "node:path";

// Reading every learning dashboard file is slow on a real BBB server
// (thousands of folders), so the parsed list is kept in memory for a while.
const CACHE_TTL_MS = (Number(process.env.COURSES_CACHE_TTL) || 300) * 1000;

let cache = { courses: null, promotions: null, expiresAt: 0, pending: null };

async function generateReplayUrl(meetingId) {
  try {
    await fs.access(join(process.env.REPLAYS_FOLDER, meetingId));
    return `${process.env.LEARNING_DASHBOARD_BASEURL}/playback/presentation/2.3/${meetingId}`;
  } catch {
    return null;
  }
}

async function readCourse(folderName, file) {
  const courseData = JSON.parse(await fs.readFile(join(folderName, file)));
  const [meetingId, reportFile] = file.split("/");
  const reportId = reportFile.split(".")[0];

  return {
    name: courseData.name,
    id: courseData.intId,
    dashboardUrl: `${process.env.LEARNING_DASHBOARD_BASEURL}/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`,
    replayUrl: await generateReplayUrl(meetingId),
    creationDate: courseData.createdOn,
    endDate: courseData.endedOn,
  };
}

export async function parseCourses() {
  if (process.env.NODE_ENV === "localdev") {
    return require("@datas/coursesDev.json");
  }
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
    throw new Error(
      "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
    );
  }

  const files = (await fs.readdir(folderName, { recursive: true })).filter(
    (file) => file.endsWith("learning_dashboard_data.json"),
  );
  return Promise.all(files.map((file) => readCourse(folderName, file)));
}

function extractPromotions(courses) {
  return [
    ...new Set(
      courses
        .map((course) => course.name.split("-")[0].trim().toLowerCase())
        .filter((promotion) => !promotion.includes("'s room"))
        .filter((promotion) => !promotion.includes(" ")),
    ),
  ].sort();
}

async function loadCourses() {
  if (cache.courses && Date.now() < cache.expiresAt) return cache;
  // Concurrent requests share the same scan instead of starting their own.
  if (!cache.pending) {
    cache.pending = parseCourses()
      .then((courses) => {
        const sorted = [...courses].sort(
          (a, b) => new Date(b.creationDate) - new Date(a.creationDate),
        );
        cache = {
          courses: sorted,
          promotions: extractPromotions(sorted),
          expiresAt: Date.now() + CACHE_TTL_MS,
          pending: null,
        };
        return cache;
      })
      .catch((error) => {
        cache.pending = null;
        throw error;
      });
  }
  return cache.pending;
}

const SORT_KEYS = ["name", "creationDate", "endDate"];
const MAX_LIMIT = 200;

function toPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export async function getCoursesPage({
  page,
  limit,
  promotion,
  search,
  sort,
  order,
}) {
  const { courses, promotions } = await loadCourses();

  const promotionTerm = promotion?.trim().toLowerCase();
  const searchTerm = search?.trim().toLowerCase();
  let filtered = courses.filter(
    (course) =>
      (!promotionTerm || course.name.toLowerCase().includes(promotionTerm)) &&
      (!searchTerm || course.name.toLowerCase().includes(searchTerm)),
  );

  if (SORT_KEYS.includes(sort)) {
    const direction = order === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      if (a[sort] < b[sort]) return -direction;
      if (a[sort] > b[sort]) return direction;
      return 0;
    });
  }

  const pageSize = Math.min(toPositiveInt(limit, 50), MAX_LIMIT);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(toPositiveInt(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: currentPage,
    limit: pageSize,
    totalPages,
    promotions,
  };
}
