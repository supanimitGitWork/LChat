import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const { content, postId } = await request.json();

        if (!content || !postId) {
            return NextResponse.json({ error: "Content and Post ID are required" }, { status: 400 });
        }

        const newComment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: userId
            },
            include: {
                author: {
                    select: { name: true, image: true }
                }
            }
        });

        return NextResponse.json(newComment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
