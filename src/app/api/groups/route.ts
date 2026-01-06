import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                groups: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user.groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const group = await prisma.group.create({
            data: {
                name,
                description,
                members: {
                    connect: { id: user.id }
                },
                admins: {
                    connect: { id: user.id }
                }
            }
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
