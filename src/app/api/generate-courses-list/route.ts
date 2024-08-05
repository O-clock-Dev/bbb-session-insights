import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { access } from "node:fs/promises";
import { getToken } from "next-auth/jwt";
import path from "node:path";
let coursesDev = null;

// Data structure of the learning_dashboard_data.json file
interface CourseData {
  name: string;
  createdOn: string;
  endedOn: string;
  intId: number;

}

// Data structure of the course object returned by the API
interface Course {
  id: number;
  name: string;
  dashboardUrl: string;
  replayUrl: string | null;
  presentationUrl: string | null;
  creationDate: string;
  endDate: string;
  meetingId: string;
  reportId: string;
}
interface Courses extends Array<Course> {}

async function generateReplayUrl(meetingId: string) {
  try {
    const folderPath = `${process.env.REPLAYS_FOLDER}${path.sep}${meetingId}`;
    await access(folderPath);
    return `${process.env.LEARNING_DASHBOARD_BASEURL}/playback/presentation/2.3/${meetingId}`;
  } catch (error) {
    return null;
  }
}

async function generatePresentationUrl(meetingId: string, reportId: string) {
  try {
      const folderPath = `${process.env.PRESENTATION_FOLDER}${path.sep}${meetingId}${path.sep}slides_new.xml`;
      console.log("Checking folder:", folderPath);
      await access(folderPath);
      return `dashboards/messages/${meetingId}/${reportId}`;
  } catch (error) {
      return null;
  }
}

export async function parseCourses() {
  if (process.env.NODE_ENV === "development") {
    coursesDev = require("@datas/coursesDev.json");
    return coursesDev;
  }
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
    throw new Error(
      "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
    );
  }

  try {
    const files = fs.readdirSync(folderName, { recursive: true });
    const courses = [];

    for (const file of files) {
      if (file.endsWith("learning_dashboard_data.json")) {
        const filePath = `${folderName}/${file}`;
        const jsonData = fs.readFileSync(filePath);
        const courseData = JSON.parse(jsonData);
        const courseName = courseData.name;
        const courseCreationDate = courseData.createdOn;
        const courseEndDate = courseData.endedOn;
        const courseId = courseData.intId;
        const meetingId = file.split("/")[0];
        const reportId = file.split("/")[1].split(".")[0];
        const dashboardUrl = `${process.env.LEARNING_DASHBOARD_BASEURL}/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`;

        // Call generateReplayUrl asynchronously and await its result
        const replayUrl = await generateReplayUrl(meetingId);

        courses.push({
          name: courseName,
          id: courseId,
          dashboardUrl: dashboardUrl,
          replayUrl: replayUrl,
          creationDate: courseCreationDate,
          endDate: courseEndDate,
        });
      }
    }
    return courses;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (token || process.env.AUTH_KEYCLOAK === "false") {
    try {
      const result = await parseCourses();
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      const response = {
        // @ts-ignore
        error: error.message,
      };
      const responseHeaders = {
        status: 500,
      };
      return NextResponse.json(response, responseHeaders);
    }
  } else {
    const response = {
      error: "Unauthorized",
    };
    const responseHeaders = {
      status: 401,
    };
    return NextResponse.json(response, responseHeaders);
  }
}
