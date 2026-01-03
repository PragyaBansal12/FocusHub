import Post from "../models/Post.js"
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Message from "../models/Message.js"; 
import jwt from "jsonwebtoken";

// 🔥 FIX: Track multiple sockets per user to support multi-tab DMs
// Structure: { "userId": Set([socketId1, socketId2]) }
const activeUsers = new Map();

export function setupSocketHandlers(io){
    io.on('connection', (socket) => {
        const token = socket.handshake.auth.token;
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                socket.userId = userId;
                
                // 🔥 FIX: Add socket to user's set of active tabs
                if (!activeUsers.has(userId)) {
                    activeUsers.set(userId, new Set());
                    // First tab opened? Notify others user is online
                    io.emit('userStatusUpdate', { userId, status: 'online' });
                }
                activeUsers.get(userId).add(socket.id);

                // Sync currently online users to the new connector
                socket.emit('initialOnlineUsers', Array.from(activeUsers.keys()));

            } catch (error) {
                socket.disconnect();
                return;
            }
        } else {
            socket.disconnect();
            return;
        }

        // --- PRIVATE MESSAGING LOGIC ---
        socket.on('sendPrivateMessage', async (data, callback) => {
            try {
                const { recipientId, text } = data;
                if (!text || !recipientId) return callback({ success: false, error: 'Content required' });

                const conversationId = [userId, recipientId].sort().join("-");
                const newMessage = await Message.create({
                    conversationId,
                    sender: userId,
                    recipient: recipientId,
                    text
                });

                const populatedMsg = await newMessage.populate('sender', 'name picture');
                
                // 🔥 FIX: Send to ALL active tabs (sockets) of the recipient
                const recipientSockets = activeUsers.get(recipientId);
                if (recipientSockets) {
                    recipientSockets.forEach(socketId => {
                        io.to(socketId).emit('receivePrivateMessage', populatedMsg);
                        // 🔥 FIX: Notify frontend to increment unread count for THIS sender
                        io.to(socketId).emit('newMessageNotification', { senderId: userId });
                    });
                }
                
                // Also send to sender's OTHER tabs so they stay in sync
                const senderSockets = activeUsers.get(userId);
                senderSockets.forEach(socketId => {
                    if (socketId !== socket.id) {
                        io.to(socketId).emit('receivePrivateMessage', populatedMsg);
                    }
                });

                callback({ success: true, message: populatedMsg });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        // --- DISCONNECT (MULTI-TAB AWARE) ---
        socket.on('disconnect', () => {
            if (userId && activeUsers.has(userId)) {
                const userSockets = activeUsers.get(userId);
                userSockets.delete(socket.id);
                
                // 🔥 FIX: Only send 'offline' if NO tabs are left open
                if (userSockets.size === 0) {
                    activeUsers.delete(userId);
                    io.emit('userStatusUpdate', { userId, status: 'offline' });
                }
            }
        });

        // --- Keep all your Forum join/leave/post/comment logic exactly as it was below ---
        socket.on('joinPost', (postId) => { socket.join(`post:${postId}`); });
        socket.on('leavePost', (postId) => { socket.leave(`post:${postId}`); });
        
        socket.on('addComment', async (data, callback) => {
            try {
                const { postId, content } = data;
                const comment = await Comment.create({ post: postId, user: userId, content });
                await comment.populate('user', 'name email picture');
                await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
                io.to(`post:${postId}`).emit('newComment', comment);
                callback({ success: true, comment });
            } catch (error) { callback({ success: false, error: error.message }); }
        });
        
        // ... (Rest of your voting/typing handlers remain unchanged)
    });
}