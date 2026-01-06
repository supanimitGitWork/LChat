import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { postId, groupId } = await req.json();
        if (!postId || !groupId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: { select: { name: true } } }
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const user = session.user as any;
        const userId = user.id;

        // Construct share message
        const shareContent = `[SYSTEM_BROADCAST: SHARED_DATA_PACKET]\nFROM_AGENT: ${post.author.name}\nCONTENT: ${post.content || "MEDIA_ONLY"}\nLINK: /feed#post-${post.id}`;

        const message = await prisma.message.create({
            data: {
                content: shareContent,
                groupId: groupId,
                senderId: userId,
                image: post.mediaUrl, // Share the image too if present
            }
        });

        return NextResponse.json({
            success: true,
            messageId: message.id
        });
    } catch (error) {
        console.error("Share failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
