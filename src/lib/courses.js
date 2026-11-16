import fs from "node:fs/promises";
import { join } from "node:path";
import { detectPromotions, normalize } from "@/lib/promotions";

// Reading every learning dashboard file is slow on a real BBB server
// (thousands of folders), so the parsed list is kept in memory for a while.
const CACHE_TTL_MS = (Number(process.env.COURSES_CACHE_TTL) || 300) * 1000;

let cache = { entries: null, promotions: null, expiresAt: 0, pending: null };

const searchDateFormats = [
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }),
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "Europe/Paris" }),
];

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

// Text matched by the search bar: session name and creation date
// ("vendredi 13 novembre 2026", "13/11/2026"), without accents or case.
function searchTextOf(course) {
  const date = new Date(course.creationDate);
  const dates = Number.isNaN(date.getTime())
    ? []
    : searchDateFormats.map((format) => format.format(date));
  return normalize([course.name, ...dates].join(" "));
}

async function loadCourses() {
  if (cache.entries && Date.now() < cache.expiresAt) return cache;
  // Concurrent requests share the same scan instead of starting their own.
  if (!cache.pending) {
    cache.pending = parseCourses()
      .then((courses) => {
        const sorted = [...courses].sort(
          (a, b) => new Date(b.creationDate) - new Date(a.creationDate),
        );
        const { promotionOf, promotions } = detectPromotions(sorted);
        cache = {
          entries: sorted.map((course) => ({
            course,
            promotion: promotionOf.get(course.id) ?? null,
            searchText: searchTextOf(course),
          })),
          promotions,
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

const SORT_KEYS = ["name", "creationDate", "endDate", "duration"];

// Sessions without an end date (0) get -1 so that they come first, then the shortest ones.
const durationOf = (course) =>
  course.endDate >= course.creationDate ? course.endDate - course.creationDate : -1;
const sortValue = (course, sort) => (sort === "duration" ? durationOf(course) : course[sort]);
const nameCollator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
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
  const { entries, promotions } = await loadCourses();

  const promotionKey = promotion ? normalize(promotion).trim() : "";
  const searchWords = normalize(search ?? "").split(/\s+/).filter(Boolean);
  let filtered = entries.filter(
    (entry) =>
      (!promotionKey || entry.promotion === promotionKey) &&
      searchWords.every((word) => entry.searchText.includes(word)),
  );

  if (SORT_KEYS.includes(sort)) {
    const direction = order === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const x = sortValue(a.course, sort);
      const y = sortValue(b.course, sort);
      if (typeof x === "string" && typeof y === "string") {
        return direction * nameCollator.compare(x, y);
      }
      if (x < y) return -direction;
      if (x > y) return direction;
      return 0;
    });
  }

  const pageSize = Math.min(toPositiveInt(limit, 50), MAX_LIMIT);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(toPositiveInt(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: filtered
      .slice(start, start + pageSize)
      .map(({ course, promotion }) => ({ ...course, promotion })),
    total,
    page: currentPage,
    limit: pageSize,
    totalPages,
    promotions,
  };
}
