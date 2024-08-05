"use client";

import CourseMessagesList from "@/components/courseMessages/CourseMessagesList";
import { useParams } from "next/navigation";

export default function Page() {
    const { meetingId, reportId, participantSlug } = useParams() as {
        meetingId: string;
        reportId: string;
        participantSlug: string;
    }
    return (
        <div>
            <CourseMessagesList meetingId={meetingId} reportId={reportId} participantSlug={participantSlug} />
        </div>
    );
}