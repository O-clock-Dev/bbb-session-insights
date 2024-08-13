import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { getToken } from "next-auth/jwt";
import slugify from 'slugify';

// Data structure of the learning_dashboard_data.json file
interface CourseDataUserIntId {
    intId: string;
    registeredOn: string;
    leftOn: string;
}

interface CourseDataUserIntIdObject {
    [key: string]: CourseDataUserIntId;
}

interface CourseDataUser {
    [key: string]: any;
    userKey: string;
    name: string;
    isModerator: boolean;
    intIds: CourseDataUserIntIdObject;
    totalOfMessages: number;
}

interface CourseDataUserObject {
    [key: string]: CourseDataUser;
}

interface CourseData {
    name: string;
    createdOn: string;
    endedOn: string;
    intId: number;
    users: CourseDataUserObject;
}

// Data structure of the course object returned by the API
interface CourseParticipant {
    name: string;
    slug: string;
    userKey: string;
    registeredOn: string;
    leftOn: string;
    totalOfMessages: number;
}

interface Course {
    id: number;
    name: string;
    dashboardUrl: string;
    creationDate: string;
    endDate: string;
    participants: CourseParticipant[];
}

async function parseCourse(meetingId: string, reportId: string) {
    const folderName = process.env.LEARNING_DASHBOARD_FOLDER;
    if (!folderName) {
        throw new Error(
            "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
        );
    }

    try {
        const fileName = `${process.env.LEARNING_DASHBOARD_FOLDER}${path.sep}${meetingId}${path.sep}${reportId}${path.sep}learning_dashboard_data.json`;
        const jsonData = await fs.readFile(fileName, 'utf-8');

        const courseData: CourseData = JSON.parse(jsonData);
        const courseName = courseData.name;
        const courseCreationDate = courseData.createdOn;
        const courseEndDate = courseData.endedOn;
        const courseId = courseData.intId;

        const courseParticipants: CourseParticipant[] = [];
        for(const userKey in courseData.users) {
            const user = courseData.users[userKey];
            if(!user.isModerator) {
                const intId = Object.keys(user.intIds)[0];
                const intIdData = user.intIds[intId];

                const slug = slugify(user.name, {lower: true});
                const participant = courseParticipants.find((participant) => participant.slug === slug);
                if(participant !== undefined) {
                    participant.totalOfMessages += user.totalOfMessages;
                } else {
                    const courseParticipant: CourseParticipant = {
                        name: user.name,
                        slug: slugify(user.name, {lower: true}),
                        userKey: user.userKey,
                        registeredOn: intIdData.registeredOn,
                        leftOn: intIdData.leftOn,
                        totalOfMessages: user.totalOfMessages,
                    }
                    courseParticipants.push(courseParticipant);
                }
            }
        }

        courseParticipants.sort((a, b) => a.name.localeCompare(b.name));

        const dashboardUrl = `${process.env.LEARNING_DASHBOARD_BASEURL}/learning-analytics-dashboard/?meeting=${meetingId}&report=${reportId}&lang=fr`;

        const course: Course = {
            name: courseName,
            id: courseId,
            dashboardUrl: dashboardUrl,
            creationDate: courseCreationDate,
            endDate: courseEndDate,
            participants: courseParticipants,
        }
        return course;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (token) {
        try {
            const meetingId = req.nextUrl.searchParams.get('meetingId');
            const reportId = req.nextUrl.searchParams.get('reportId');
            if(!meetingId) {
                throw new Error("parameter meetingId is required in the query string");
            }
            if(!reportId) {
                throw new Error("parameter reportId is required in the query string");
            }
            const result = await parseCourse(meetingId, reportId);
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
