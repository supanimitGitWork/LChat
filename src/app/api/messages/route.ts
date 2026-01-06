import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
        return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                groupId: groupId,
            },
            include: {
                sender: {
                    select: { name: true, image: true, id: true }
                }
            },
            orderBy: {
                createdAt: "asc",
            },
            take: 50, // Limit to last 50 messages
        });

        const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: msg.sender?.name || "Unknown",
            senderImage: msg.sender?.image,
            createdAt: msg.createdAt,
            image: msg.image,
        }));

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
