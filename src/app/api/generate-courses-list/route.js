import { NextResponse } from "next/server";
import fs from "node:fs";
import { authOptions } from "../auth/[...nextauth]/route";
import { getToken } from "next-auth/jwt";

export async function parseCourses() {
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
    throw new Error(
      "LEARNING_DASHBOARD_FOLDER n'est pas défini dans les variables d'environnement",
    );
  }

  try {
    const files = fs.readdirSync(folderName, { recursive: true });
    const courses = [];

    files.forEach((file) => {
      if (file.endsWith("learning_dashboard_data.json")) {
        const filePath = `${folderName}/${file}`;
        const jsonData = fs.readFileSync(filePath);
        const courseData = JSON.parse(jsonData);
        const courseName = courseData.name;
        // const courseCreationDate = convertUnixTimeStamp(courseData.createdOn);
        const courseCreationDate = courseData.createdOn;
        const courseEndDate = courseData.endedOn;
        const courseId = courseData.intId;
        const meetingId = file.split("/")[0];
        const reportId = file.split("/")[1].split(".")[0];
        const url = `${process.env.LEARNING_DASHBOARD_BASEURL}/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`;

        courses.push({
          name: courseName,
          id: courseId,
          url: url,
          creationDate: courseCreationDate,
          endDate: courseEndDate,
        });
      }
    });

    return courses;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function GET(req, res) {
  const token = await getToken({ req });
  if (token) {
    try {
      const result = await parseCourses();
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      const response = {
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
