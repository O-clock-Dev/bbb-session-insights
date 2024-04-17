import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import slugify from 'slugify';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";
import process from 'process';

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
    timestamp: string;
}
interface participant {
    name: string;
    slug: string;
    messages: participantMessage[];
}
interface participants extends Array<participant> {}

async function generateMessages(dataJson: any) {
    const participants: participants = [];

    for(let i = 0; i < dataJson.popcorn.chattimeline.length; i++) {
        const messageData: messageData = dataJson.popcorn.chattimeline[i];
        const name = messageData.name;
        const message = messageData.message;
        const senderRole = messageData.senderRole;
        const timestamp = messageData.in.split('.')[0];

        // Not capture messages from the moderators
        if(senderRole !== 'VIEWER') continue;

        const participantIndex = participants.findIndex(participant => participant.name === name);
        if(participantIndex === -1) {
            participants.push({
                name: name,
                slug: slugify(name, { lower: true }),
                messages: [{ message: message, timestamp: timestamp }]
            });
        } else {
            participants[participantIndex].messages.push({ message: message, timestamp: timestamp });
        }
    }

    // Sort participants by name
    participants.sort((a, b) => a.name.localeCompare(b.name));

    return participants;
}

export async function GET(
    req: NextRequest,
) {
    const token = await getToken({ req });

    if (token) {
        const folderName = `${process.env.PRESENTATION_FOLDER}`;
        const meetingId = req.nextUrl.searchParams.get('meetingId');
        if (!folderName) {
            throw new Error(
                "LEARNING_DASHBOARD_FOLDER is not defined in the environment variables",
            );
        }
        if (!meetingId) {
            throw new Error("parameter meetingId is required in the query string");
        }
        const fileName = `${folderName}${path.sep}${meetingId}${path.sep}slides_new.xml`
        const dataXml = await fs.readFile(fileName, 'utf-8');
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : ""});
        const dataJson = await parser.parse(dataXml);
        const participants = await generateMessages(dataJson);

        return NextResponse.json({ participants: participants }, { status: 200 })
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