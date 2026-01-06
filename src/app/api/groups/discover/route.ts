import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find groups where users is NOT a member
        const discoverableGroups = await prisma.group.findMany({
            where: {
                NOT: {
                    members: {
                        some: { id: user.id }
                    }
                }
            },
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20 // Limit discovery
        });

        const formattedGroups = discoverableGroups.map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            memberCount: group._count.members
        }));

        return NextResponse.json(formattedGroups);
    } catch (error) {
        console.error("Error discovering groups:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
