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

        const { postId } = await req.json();
        if (!postId) {
            return NextResponse.json({ error: "Missing postId" }, { status: 400 });
        }

        const user = session.user as any;
        const userId = user.id;

        // Check if like exists
        const existingLike = await prisma.like.findUnique({
            where: {
                authorId_postId: {
                    authorId: userId,
                    postId: postId,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: {
                    id: existingLike.id,
                },
            });
        } else {
            // Like
            await prisma.like.create({
                data: {
                    authorId: userId,
                    postId: postId,
                },
            });
        }

        // Get updated count
        const boostCount = await prisma.like.count({
            where: { postId: postId },
        });

        return NextResponse.json({
            boosted: !existingLike,
            boostCount: boostCount,
        });
    } catch (error) {
        console.error("Boost failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
