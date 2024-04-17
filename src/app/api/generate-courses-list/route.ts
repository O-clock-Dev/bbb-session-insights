import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { access } from "node:fs/promises";
import { getToken } from "next-auth/jwt";
import path from "node:path";

async function generateReplayUrl(meetingId: string) {
  try {
    const folderPath = `${process.env.REPLAYS_FOLDER}${path.sep}${meetingId}`;
    await access(folderPath);
    return `${process.env.LEARNING_DASHBOARD_BASEURL}${path.sep}playback${path.sep}presentation${path.sep}2.3${path.sep}${meetingId}`;
  } catch (error) {
    return null;
  }
}

export async function parseCourses() {
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
    throw new Error(
      "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
    );
  }

  try {
    const files = fs.readdirSync(folderName, { recursive: true }) as string[];
    const courses = [];

    for (const file of files) {
      if (file.endsWith("learning_dashboard_data.json")) {
        const filePath = `${folderName}${path.sep}${file}`;
        const jsonData = fs.readFileSync(filePath);
        // @ts-ignore
        const courseData = JSON.parse(jsonData);
        const courseName = courseData.name;
        const courseCreationDate = courseData.createdOn;
        const courseEndDate = courseData.endedOn;
        const courseId = courseData.intId;
        const meetingId = file.split(path.sep)[0];
        const reportId = file.split(path.sep)[1].split(".")[0];
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
  if (token) {
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
