import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: {
                    select: { name: true, image: true }
                },
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(posts)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { content, mediaUrl, authorId } = body // In real app, get authorId from session

        const post = await prisma.post.create({
            data: {
                content,
                mediaUrl,
                authorId,
                groupId: "global" // Assuming a global feed or specific group logic
            }
        })
        return NextResponse.json(post)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }
}
