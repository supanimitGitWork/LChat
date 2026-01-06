import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: { postId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { postId } = params;
        const user = session.user as any;
        const userId = user.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        if (post.authorId !== userId) {
            return NextResponse.json({ error: "Forbidden: Not the author" }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
