import { NextResponse } from "next/server";
import fs from 'node:fs'
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

function convertUnixTimeStamp(timestamp) {
  const options = {
    weekday: 'long',
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric"
  }
  // let date = new Date(timestamp * 1000)
  const date = (new Intl.DateTimeFormat("fr-FR", options).format(timestamp));
  return date
}

export async function parseCourses() {
  const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
  if (!folderName) {
      throw new Error("LEARNING_DASHBOARD_FOLDER n'est pas défini dans les variables d'environnement");
  }
  
  try {
      const files = fs.readdirSync(folderName, {recursive: true});
      const courses = [];
      
      files.forEach(file => {
          if (file.endsWith('learning_dashboard_data.json')) {
              const filePath = `${folderName}/${file}`;
              const jsonData = fs.readFileSync(filePath);
              const courseData = JSON.parse(jsonData);              
              const courseName = courseData.name;
              const courseCreationDate = convertUnixTimeStamp(courseData.createdOn);
              const courseEndDate = convertUnixTimeStamp(courseData.endedOn);
              const courseId = courseData.intId
              const meetingId = file.split('/')[0];
              const reportId = file.split('/')[1].split('.')[0];
              const url = `https://bbb1.oclock.school/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`;
              
              courses.push({
                 name: courseName,
                 id: courseId, 
                 url: url, 
                 creationDate: courseCreationDate, 
                 endDate: courseEndDate });
          }
      });

      return courses;
  } catch (error) {
      console.error(error);
      throw error;
  }
}



export async function GET(req, res) {
  //const session = await getServerSession(authOptions)
    try {
      const result = await parseCourses()
      return NextResponse.json(result);
        }
      catch (error) {
        console.error(error);
        const response = {
          error: error.message,
        };
        const responseHeaders = {
          status: 500,
        };
        return NextResponse.json(response, responseHeaders);
      }
  }  
  