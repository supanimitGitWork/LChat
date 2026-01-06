import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { groupId } = await request.json();

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { groups: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already a member
        const isMember = user.groups.some(group => group.id === groupId);
        if (isMember) {
            return NextResponse.json({ message: "Already a member" });
        }

        await prisma.group.update({
            where: { id: groupId },
            data: {
                members: {
                    connect: { id: user.id }
                }
            }
        });

        return NextResponse.json({ message: "Joined successfully" });
    } catch (error) {
        console.error("Error joining group:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
