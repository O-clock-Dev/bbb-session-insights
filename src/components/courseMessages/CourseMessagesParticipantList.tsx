"use client";

import { Suspense } from "react";
import Link from 'next/link';
import clsx from 'clsx';

interface ParticipantListProps {
    courseData: any;
    meetingId: string;
    reportId: string;
    selectedParticipantSlug: string;
}
export default function ParticipantList({courseData, meetingId, reportId, selectedParticipantSlug}: ParticipantListProps) {
    return (
        <div>
            <p className={"text-center mb-5"}>Liste des apprenants ({courseData.participants.length})</p>
            <dl className="max-w-md text-gray-900 dark:text-white">
                {courseData.participants.map((participant: any) => (
                    <Suspense key={participant.name} fallback={<div>Loading...</div>}>
                        <Link
                            href={`/messages/${meetingId}/${reportId}/${participant.slug}`}
                            className={clsx(
                                'flex flex-col',
                                'my-2',
                                'rounded-lg bg-gray-800 border border-gray-500',
                                'divide-gray-700 p-1',
                                'hover:bg-slate-700',
                                // active participant
                                participant.slug === selectedParticipantSlug ? 'bg-slate-700' : '',
                            )}
                        >
                            <dt className="mb-1 text-gray-400 md:text-base px-5 flex items-center justify-between">
                                <span className="text-md">{participant.name}&nbsp;-&nbsp;</span>
                                <span className="text-xs">{participant.totalOfMessages} messages</span>
                            </dt>
                        </Link>
                    </Suspense>
                ))}
            </dl>
        </div>
    );
}