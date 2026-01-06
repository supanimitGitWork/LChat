"use client"

import { useParams } from "next/navigation"
import { ChatWindow } from "@/components/chat/chat-window"

export default function GroupChatPage() {
    const params = useParams()
    const groupId = params.groupId as string

    // In a real app, we would fetch group details here
    const groupName = `Group ${groupId}` // Mock name

    return (
        <div className="h-full w-full">
            <ChatWindow groupId={groupId} />
        </div>
    )
}
