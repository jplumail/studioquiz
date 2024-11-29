/* This page is used to create a room */
'use client';

import { types } from "@/types";
import { useState } from "react";
import { hostname, gameServerUrl } from "../../../shared/constants"

const CopyLinkTextbox = ({ link }: { link: string }) => {
    const [copySuccess, setCopySuccess] = useState("");

    const handleCopy = () => {
        navigator.clipboard.writeText(link).then(
            () => {
                setCopySuccess("Copied!");
                setTimeout(() => setCopySuccess(""), 2000); // Reset after 2 seconds
            },
            () => {
                setCopySuccess("Failed to copy!");
            }
        );
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
                padding: "8px",
                width: "300px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
            }}>
                {link}
                <div onClick={handleCopy} style={{
                    color: "white",
                }}>
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" style={{
                        fill: "currentColor",
                    }}>
                        <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                    </svg>
                </div>
            </div>

            {copySuccess && <span>{copySuccess}</span>}
        </div>
    );
};

export default function Page() {
    const [room, setRoom] = useState<types.RoomId | null>(null);
    const roomUrl = `/jouer/${room}`;

    function handleRoomCreation() {
        // redirect to the room page
        console.log("fetching room creation...");
        fetch(`${gameServerUrl}/api/room/create`, { method: "POST" })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("data", data);
                setRoom(data.room);
            })
            .catch(error => {
                console.error("Error fetching room creation:", error);
            });
    }

    return (
        <>
            <button onClick={handleRoomCreation}>Create Room</button>
            {room && <><CopyLinkTextbox link={`${hostname}/${roomUrl}`} /><a href={roomUrl}><button>JOIN</button></a></>}
        </>
    );
}