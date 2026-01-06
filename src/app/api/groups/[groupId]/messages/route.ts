import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
    try {
        const messages = await prisma.message.findMany({
            where: {
                groupId: params.groupId
            },
            include: {
                sender: {
                    select: { name: true, image: true }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
    try {
        const body = await req.json()
        const { content, senderId } = body // In real app, get senderId from session

        const message = await prisma.message.create({
            data: {
                content,
                groupId: params.groupId,
                senderId
            }
        })
        return NextResponse.json(message)
    } catch (error) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
}
