"use client";

import useSWR from "swr";
import ConvertUnixTimestamp from "@/utils/convertUnixTimestamp";

interface ParticipantMessagesProps {
    meetingId: string;
    reportId: string;
    participantSlug: string;
}
export default function CourseMessagesList({meetingId, reportId, participantSlug}: ParticipantMessagesProps) {

    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const {data, error} = useSWR(
        "/dashboards/api/generate-course-participant-messages?meetingId=" + meetingId + "&reportId=" + reportId + "&participantSlug=" + participantSlug,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            revalidateIfStale: false,
        },
    );

    const participant = data?.participant;

    if (error) return <div>Failed to load</div>;
    if (!data)
        return (
            <div
                className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
                role="status"
                aria-label="loading"
            >
                <span className="sr-only">Chargement en cours...</span>
            </div>
        );
    return (
        <div>
                <p className={"text-2xl text-center mb-10 text-red-400"}>Messages de l'apprenant sélectionné
                    - {participant.name ? participant.name : participant.slug} - {participant.messages.length} messages</p>
                {participant?.messages.length === 0 &&
                    <p className={"text-center text-lg text-gray-500"}>Aucun message pour cet apprenant</p>}
                <div className={"m-10"}>
                    {participant?.messages.map((messageInfo: { message: string; timestamp: number; }) => (
                        <div className="pl-10 py-1 flex border-b border-b-1 border-gray-600">
                            <span
                                className="mx-5 text-gray-500 md:text-lg dark:text-gray-400 w-1/4">{ConvertUnixTimestamp(messageInfo.timestamp)}</span>
                            <span className="text-lg w-3/4">{messageInfo.message}</span>
                        </div>
                    ))}
                </div>
        </div>
    );
}