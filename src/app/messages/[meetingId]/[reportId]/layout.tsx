"use client";

import React from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import CourseMessagesHeader from "@/components/courseMessages/CourseMessagesHeader";
import CourseMessagesParticipantList from "@/components/courseMessages/CourseMessagesParticipantList";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { meetingId, reportId, participantSlug } = useParams() as {
    meetingId: string;
    reportId: string;
    participantSlug: string;
  };
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, error } = useSWR(
    "/dashboards/api/generate-course?meetingId=" +
      meetingId +
      "&reportId=" +
      reportId,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateIfStale: false,
    }
  );

  if (error) return <div>Failed to load</div>;
  if (!data) {
    return (
      <div
        className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Chargement en cours...</span>
      </div>
    );
  }

  return (
    <div>
      <CourseMessagesHeader courseData={data} />
      <div className={"flex justify-evenly pt-8"}>
        <div className={"text-2xl ml-5 w-1/5"}>
          <CourseMessagesParticipantList
            courseData={data}
            selectedParticipantSlug={participantSlug}
            meetingId={meetingId}
            reportId={reportId}
          />
        </div>
        <div className={"w-4/5 text-sm"}>{children}</div>
      </div>
    </div>
  );
}
