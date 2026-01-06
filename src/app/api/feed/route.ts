import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        // Fetch posts from groups the user is a member of
        const posts = await prisma.post.findMany({
            where: {
                group: {
                    members: {
                        some: {
                            id: userId
                        }
                    }
                }
            },
            include: {
                author: {
                    select: { name: true, image: true, id: true }
                },
                group: {
                    select: { name: true, id: true }
                },
                comments: {
                    include: {
                        author: {
                            select: { name: true, image: true }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        authorId: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 30
        });

        const formatted = posts.map((post: any) => {
            return {
                ...post,
                authorName: post.author.name,
                authorImage: post.author.image,
                groupName: post.group.name,
                groupId: post.group.id,
                commentsCount: post.comments.length,
                comments: post.comments.map((c: any) => ({
                    ...c,
                    authorName: c.author.name,
                    authorImage: c.author.image
                })),
                boostCount: post.likes.length,
                isBoosted: post.likes.some((l: any) => l.authorId === userId)
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching feed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId = (session.user as any).id;

    if (!userId && session.user.email) {
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });
        userId = dbUser?.id;
    }

    if (!userId) {
        console.error("Feed POST: No userId found in session or DB", { email: session.user.email });
        return NextResponse.json({ error: "BROADCAST_FAILURE: IDENTITY_NOT_FOUND" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { content, groupId, mediaUrl } = body;

        console.log("Feed POST request:", { userId, groupId, hasContent: !!content, hasMedia: !!mediaUrl });

        if (!content && !mediaUrl) {
            return NextResponse.json({ error: "BROADCAST_FAILURE: PAYLOAD_REQUIRED" }, { status: 400 });
        }

        if (!groupId) {
            return NextResponse.json({ error: "BROADCAST_FAILURE: TARGET_NODE_REQUIRED" }, { status: 400 });
        }

        // Verify membership
        console.log("Feed POST: Verifying membership for:", userId, "in group:", groupId);
        const membership = await prisma.group.findFirst({
            where: {
                id: groupId,
                members: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        if (!membership) {
            console.error("Feed POST: Membership check failed for user:", userId, "in group:", groupId);
            const groupExists = await prisma.group.findUnique({ where: { id: groupId } });
            if (!groupExists) {
                return NextResponse.json({ error: "BROADCAST_FAILURE: NODE_NOT_FOUND" }, { status: 404 });
            }
            return NextResponse.json({ error: "BROADCAST_FAILURE: ACCESS_DENIED (NOT_A_MEMBER)" }, { status: 403 });
        }

        const newPost = await prisma.post.create({
            data: {
                content,
                mediaUrl,
                mediaType: mediaUrl ? "IMAGE" : null,
                authorId: userId,
                groupId: groupId
            }
        });

        console.log("Post created successfully:", newPost.id);
        return NextResponse.json(newPost);
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Internal Server Error", message: (error as any).message }, { status: 500 });
    }
}
