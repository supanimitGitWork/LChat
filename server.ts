import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);
    const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socket IDs

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("user_connected", (userId) => {
            if (!userId) return;

            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
                // First connection for this user, broadcast online status
                io.emit("user_online", userId);
            }
            onlineUsers.get(userId)?.add(socket.id);

            // Send current online users to the new connector
            socket.emit("online_users_list", Array.from(onlineUsers.keys()));

            console.log(`User ${userId} established connection via ${socket.id}`);

            // Attach userId to socket for disconnect cleanup
            (socket as any).userId = userId;
        });

        socket.on("join_room", (groupId) => {
            socket.join(groupId);
            console.log(`Socket ${socket.id} joined room ${groupId}`);
        });

        socket.on("group_created", (group) => {
            // Broadcast to everyone so they update their sidebar
            io.emit("new_group_available", group);
        });

        socket.on("send_message", async (message) => {
            try {
                // Save to Database
                let senderId = message.senderId;

                if (!senderId) {
                    console.error("No senderId provided");
                    return;
                }

                const savedMessage = await prisma.message.create({
                    data: {
                        content: message.content,
                        groupId: message.groupId,
                        senderId: senderId,
                        image: message.image,
                    },
                    include: {
                        sender: { select: { name: true, image: true } }
                    }
                });

                const broadcastMessage = {
                    ...message,
                    id: savedMessage.id,
                    senderId: savedMessage.senderId,
                    senderName: savedMessage.sender?.name || "Unknown",
                    senderImage: savedMessage.sender?.image,
                    createdAt: savedMessage.createdAt
                };

                // Broadcast to the specific room (group)
                if (message.groupId) {
                    io.to(message.groupId).emit("receive_message", broadcastMessage);
                }
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("disconnect", () => {
            const userId = (socket as any).userId;
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets?.delete(socket.id);

                if (userSockets?.size === 0) {
                    onlineUsers.delete(userId);
                    // Last connection for this user closed, broadcast offline status
                    io.emit("user_offline", userId);
                }
            }
            console.log("Client disconnected:", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
