import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import slugify from 'slugify';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";
import process from 'process';

interface CourseData {
    name: string;
    createdOn: string;
    endedOn: string;
    intId: number;
}

interface messageData {
    in: string;
    direction: string;
    name: string;
    message: string;
    senderRole: string;
    chatEmphasizedText: string;
    target: string;
}

interface participantMessage {
    message: string;
    timestamp: number;
}
interface participant {
    name: string;
    slug: string;
    messages: participantMessage[];
}

async function getMeetingStartTime(meetingId: string, reportId: string): Promise<string> {
    const folderName = `${process.env.LEARNING_DASHBOARD_FOLDER}`;
    if (!folderName) {
        throw new Error(
            "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
        );
    }

    const fileName = `${process.env.LEARNING_DASHBOARD_FOLDER}${path.sep}${meetingId}${path.sep}${reportId}${path.sep}learning_dashboard_data.json`;
    const jsonData = await fs.readFile(fileName, 'utf-8');
    const courseData: CourseData = JSON.parse(jsonData);
    const courseCreationDate = courseData.createdOn;
    return courseCreationDate;
}

async function generateMessages(dataJson: any, meetingStartTime: string, searchedParticipantSlug: string): Promise<participant> {
    const participant: participant = {
        name: '',
        slug: searchedParticipantSlug,
        messages: []
    };

    for(let i = 0; i < dataJson.popcorn.chattimeline.length; i++) {
        const messageData: messageData = dataJson.popcorn.chattimeline[i];
        const name = messageData.name;
        const message = messageData.message;
        const senderRole = messageData.senderRole;
        const timestamp = messageData.in.split('.')[0];

        // Not capture messages from the moderators
        if(senderRole !== 'VIEWER') continue;

        const slug = slugify(name, { lower: true });
        const timestampFromStartTime = Number(meetingStartTime) + Number(timestamp) * 1000

        if(slug === searchedParticipantSlug) {
            if (participant.name === '') {
                participant.name = name;
                participant.slug = slug;
                participant.messages = [{message: message, timestamp: timestampFromStartTime}];
            } else {
                participant.messages.push({message: message, timestamp: timestampFromStartTime});
            }
        }
    }

    return participant;
}

async function parseMessagesFile(meetingId: string, reportId: string, searchedParticipantSlug: string) {
    const folderName = `${process.env.LEARNING_DASHBOARD_FOLDER}`;
    if (!folderName) {
        throw new Error(
            "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
        );
    }

    const fileName = `${folderName}${path.sep}${meetingId}${path.sep}${reportId}${path.sep}slides_new.xml`
    const dataXml = await fs.readFile(fileName, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : ""});
    const dataJson = await parser.parse(dataXml);

    const meetingStartTime = await getMeetingStartTime(meetingId, reportId);

    const participants = await generateMessages(dataJson, meetingStartTime, searchedParticipantSlug);

    return participants;
}

export async function GET(
    req: NextRequest,
) {
    const token = await getToken({ req });

    if (token || process.env.AUTH_KEYCLOAK === "false") {
        try {
        const meetingId = req.nextUrl.searchParams.get('meetingId');
        const reportId = req.nextUrl.searchParams.get('reportId');
        const participantSlug = req.nextUrl.searchParams.get('participantSlug');

        if (!meetingId) {
            throw new Error("parameter meetingId is required in the query string");
        }
        if (!reportId) {
            throw new Error("parameter reportId is required in the query string");
        }
        if(!participantSlug) {
            throw new Error("parameter participantSlug is required in the query string");
        }
        const participant = await parseMessagesFile(meetingId, reportId, participantSlug);

        return NextResponse.json({ participant: participant }, { status: 200 })
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