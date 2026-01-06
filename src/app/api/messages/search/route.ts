import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const query = searchParams.get("q");

    if (!groupId || !query) {
        return NextResponse.json({ error: "Group ID and query are required" }, { status: 400 });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                groupId: groupId,
                content: {
                    contains: query,
                },
            },
            include: {
                sender: {
                    select: { name: true, image: true, id: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        const formatted = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: msg.sender?.name || "Unknown",
            senderImage: msg.sender?.image,
            createdAt: msg.createdAt,
            image: msg.image,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error searching messages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
