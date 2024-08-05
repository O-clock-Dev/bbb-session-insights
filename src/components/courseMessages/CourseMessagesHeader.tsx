"use client";

import Link from 'next/link';
import React from "react";
import convertUnixTimeStamp from "@/utils/convertUnixTimestamp";

interface CourseMessagesHeaderProps {
    courseData: any;
}
export default function CourseMessagesHeader({courseData}: CourseMessagesHeaderProps) {
    return (
        <div
            className={"p-8 flex justify-between text-lg text-white-400 bg-slate-800 items-center border-b-2 border-gray-500"}>
            <ul className={"flex gap-2"}>
                <li><Link
                    className={"text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"}
                    href={"/"}>Retour</Link></li>
                <li><Link
                    className={"text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"}
                    href={courseData.dashboardUrl}>Dashboard</Link></li>
            </ul>
            <ul>
                <li><h1 className={"text-2xl"}>Module : {courseData.name}</h1></li>
                <li>Dates : {convertUnixTimeStamp(courseData.creationDate)} - {convertUnixTimeStamp(courseData.endDate)}</li>
            </ul>
        </div>
    );
}