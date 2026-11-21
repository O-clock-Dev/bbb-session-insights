import fs from "node:fs/promises";
import { join } from "node:path";
import { detectPromotions, normalize } from "@/lib/promotions";

// Reading every learning dashboard file is slow on a real BBB server
// (thousands of folders), so the parsed list is kept in memory for a while.
const CACHE_TTL_MS = (Number(process.env.COURSES_CACHE_TTL) || 300) * 1000;
// How many dashboard files are read at the same time during a scan. Reading them all at once
// makes the CPU spike on the BBB server, a few at a time spreads the load.
const SCAN_CONCURRENCY = Math.max(1, Number.parseInt(process.env.COURSES_SCAN_CONCURRENCY, 10) || 4);

let cache = { entries: null, promotions: null, courses: null, expiresAt: 0, pending: null };

// Dashboard files already parsed, by path relative to LEARNING_DASHBOARD_FOLDER:
// { mtimeMs, size, meetingId, course, searchText }. A file is only read again when it changes,
// so after the first scan a refresh only lists the folders and reads the new sessions.
let parsedFiles = new Map();
let lastScan = { courses: null, replays: null };
// Dashboard files found in each meeting folder: { mtimeMs, files, complete }. Listing every folder
// recursively is the slowest part of a scan, so a folder is only listed again when its
// modification time changes (a report was added or removed) or when a report had no file yet.
let meetingFolders = new Map();

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

// Text matched by the search bar: session name and creation date
// ("vendredi 13 novembre 2026", "13/11/2026"), without accents or case.
function searchTextOf(course) {
  const date = new Date(course.creationDate);
  const dates = Number.isNaN(date.getTime())
    ? []
    : searchDateFormats.map((format) => format.format(date));
  return normalize([course.name, ...dates].join(" "));
}

// Runs fn on every item, at most `concurrency` at a time, and keeps the order of the results.
async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// Meeting ids that have a published replay: one listing instead of one check per session.
async function listReplays() {
  try {
    return new Set(await fs.readdir(process.env.REPLAYS_FOLDER));
  } catch {
    return new Set();
  }
}

const DASHBOARD_FILE = "learning_dashboard_data.json";

async function listMeetingFolder(folderName, meeting) {
  const dir = join(folderName, meeting);
  const { mtimeMs } = await fs.stat(dir);
  const known = meetingFolders.get(meeting);
  if (known && known.complete && known.mtimeMs === mtimeMs) return known;

  const listing = await fs.readdir(dir, { recursive: true });
  const files = listing.filter((file) => file.endsWith(DASHBOARD_FILE));
  // Report folders are directly inside the meeting folder; each should hold its dashboard file.
  const reports = listing.filter((entry) => !entry.includes("/") && !entry.endsWith(DASHBOARD_FILE));
  return {
    mtimeMs,
    files: files.map((file) => `${meeting}/${file}`),
    complete: reports.every((report) => files.some((file) => file.startsWith(`${report}/`))),
  };
}

// Paths of the dashboard files, relative to folderName ("<meeting>/<report>/learning_dashboard_data.json").
async function listDashboardFiles(folderName) {
  const entries = await fs.readdir(folderName, { withFileTypes: true });
  const meetings = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const listings = await mapWithConcurrency(meetings, SCAN_CONCURRENCY, (meeting) =>
    listMeetingFolder(folderName, meeting).catch(() => null),
  );
  const nextFolders = new Map();
  listings.forEach((listing, index) => {
    if (listing) nextFolders.set(meetings[index], listing);
  });
  meetingFolders = nextFolders;
  return listings.flatMap((listing) => listing?.files ?? []);
}

const sameSet = (a, b) => a?.size === b?.size && [...a].every((value) => b.has(value));

async function readReport(folderName, file) {
  const path = join(folderName, file);
  const stats = await fs.stat(path);
  const previous = parsedFiles.get(file);
  if (previous && previous.mtimeMs === stats.mtimeMs && previous.size === stats.size) {
    return { ...previous, changed: false };
  }

  const courseData = JSON.parse(await fs.readFile(path, "utf8"));
  const [meetingId, reportFile] = file.split("/");
  const reportId = reportFile.split(".")[0];
  const course = {
    name: courseData.name,
    id: courseData.intId,
    dashboardUrl: `${process.env.LEARNING_DASHBOARD_BASEURL}/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`,
    replayUrl: null,
    creationDate: courseData.createdOn,
    endDate: courseData.endedOn,
  };
  return {
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    meetingId,
    course,
    searchText: searchTextOf(course),
    changed: true,
  };
}

// Returns the sessions found in LEARNING_DASHBOARD_FOLDER, each with its search text.
// When nothing changed since the previous scan, the previous array is returned as is.
export async function parseCourses() {
  if (process.env.NODE_ENV === "localdev") {
    if (!lastScan.courses) {
      lastScan.courses = require("@datas/coursesDev.json").map((course) => ({
        course,
        searchText: searchTextOf(course),
      }));
    }
    return lastScan.courses;
  }
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
    throw new Error(
      "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
    );
  }

  const [files, replays] = await Promise.all([listDashboardFiles(folderName), listReplays()]);

  const reports = await mapWithConcurrency(files, SCAN_CONCURRENCY, (file) =>
    // A file BBB is still writing can be incomplete: skip it, it is read again on the next scan.
    readReport(folderName, file).catch((error) => {
      console.warn(`Skipping ${file}: ${error.message}`);
      return null;
    }),
  );

  const nextParsedFiles = new Map();
  let changed = files.length !== parsedFiles.size || !sameSet(replays, lastScan.replays);
  reports.forEach((report, index) => {
    if (!report) {
      changed = true;
      return;
    }
    const { changed: reportChanged, ...entry } = report;
    if (reportChanged) changed = true;
    nextParsedFiles.set(files[index], entry);
  });
  parsedFiles = nextParsedFiles;

  if (!changed && lastScan.courses) return lastScan.courses;

  const baseUrl = process.env.LEARNING_DASHBOARD_BASEURL;
  lastScan = {
    replays,
    courses: [...parsedFiles.values()].map(({ meetingId, course, searchText }) => ({
      course: {
        ...course,
        replayUrl: replays.has(meetingId)
          ? `${baseUrl}/playback/presentation/2.3/${meetingId}`
          : null,
      },
      searchText,
    })),
  };
  return lastScan.courses;
}

async function buildCache() {
  const courses = await parseCourses();
  // Same sessions as last time: keep the sorted list and the promotions.
  if (courses === cache.courses) {
    return { ...cache, expiresAt: Date.now() + CACHE_TTL_MS, pending: null };
  }
  const sorted = [...courses].sort(
    (a, b) => new Date(b.course.creationDate) - new Date(a.course.creationDate),
  );
  const { promotionOf, promotions } = detectPromotions(sorted.map(({ course }) => course));
  return {
    entries: sorted.map(({ course, searchText }) => ({
      course,
      promotion: promotionOf.get(course.id) ?? null,
      searchText,
    })),
    promotions,
    courses,
    expiresAt: Date.now() + CACHE_TTL_MS,
    pending: null,
  };
}

// Concurrent requests share the same scan instead of starting their own.
function refreshCache() {
  if (!cache.pending) {
    cache.pending = buildCache()
      .then((next) => {
        cache = next;
        return next;
      })
      .finally(() => {
        cache.pending = null;
      });
  }
  return cache.pending;
}

async function loadCourses() {
  if (cache.entries && Date.now() < cache.expiresAt) return cache;
  // Once a list exists, nobody waits for a scan: the previous list is served while
  // the new one is built in the background.
  if (cache.entries) {
    refreshCache().catch((error) => console.error("Refreshing the sessions failed:", error));
    return cache;
  }
  return refreshCache();
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
