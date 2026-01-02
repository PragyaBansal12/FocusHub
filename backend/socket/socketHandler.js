import Post from "../models/Post.js"
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Message from "../models/Message.js"; // 🔥 NEW: Required for DMs
import jwt from "jsonwebtoken";

const activeUsers = new Map();

export function setupSocketHandlers(io){
    io.on('connection', (socket) => {
        console.log('User connected: ', socket.id);

        // --- 1. AUTHENTICATION (YOUR ORIGINAL LOGIC) ---
        const token = socket.handshake.auth.token;
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                socket.userId = userId;
                
                // 🔥 Tracking for DMs and Status
                activeUsers.set(userId, socket.id);
                
                console.log('Socket authenticated for user: ', userId);
                
                // Notify everyone this user is online
                io.emit('userStatusUpdate', { userId, status: 'online' });
                
                // Sync current online status to the new connector
                socket.emit('initialOnlineUsers', Array.from(activeUsers.keys()));

            } catch (error) {
                console.error('Socket auth failed: ', error.message);
                socket.disconnect();
                return;
            }
        } else {
            console.log('Unauthenticated socket connection');
            socket.disconnect();
            return;
        }

        // --- 2. 🔥 NEW: PRIVATE MESSAGING LOGIC ---
        // (Inserted without touching forum logic)
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
                const recipientSocket = activeUsers.get(recipientId);
                
                if (recipientSocket) {
                    io.to(recipientSocket).emit('receivePrivateMessage', populatedMsg);
                }
                callback({ success: true, message: populatedMsg });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        // --- 3. FORUM ROOMS (YOUR ORIGINAL LOGIC) ---
        socket.on('joinPost', (postId) => {
            socket.join(`post:${postId}`);
            console.log(`📍 User ${userId} joined post:${postId}`);
        });

        socket.on('leavePost', (postId) => {
            socket.leave(`post:${postId}`);
            console.log(`🚪 User ${userId} left post:${postId}`);
        });

        // --- 4. POST EVENTS (YOUR ORIGINAL LOGIC) ---
        socket.on('createPost', async (data, callback) => {
            try {
                console.log('📝 Creating post:', data.title);
                if (!data.title || !data.content) {
                    return callback({ success: false, error: 'Title and content required' });
                }
                const post = await Post.create({
                    user: userId,
                    title: data.title,
                    content: data.content,
                    tags: data.tags || []
                });
                await post.populate('user', 'name email picture');
                io.emit('newPost', post);
                callback({ success: true, post });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        socket.on('upvotePost', async (postId, callback) => {
            try {
                const post = await Post.findById(postId);
                if (!post) return callback({ success: false, error: 'Post not found' });
                post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
                const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
                if (hasUpvoted) {
                    post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
                } else {
                    post.upvotes.push(userId);
                }
                await post.save();
                io.emit('postVoteUpdate', {
                    postId,
                    upvotes: post.upvotes.length,
                    downvotes: post.downvotes.length
                });
                callback({ success: true, upvotes: post.upvotes.length });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        socket.on('deletePost', async (postId, callback) => {
            try {
                const post = await Post.findOne({ _id: postId, user: userId });
                if (!post) return callback({ success: false, error: 'Post not found or unauthorized' });
                await Comment.deleteMany({ post: postId });
                await Post.deleteOne({ _id: postId });
                io.emit('postDeleted', postId);
                callback({ success: true });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        // --- 5. COMMENT EVENTS (YOUR ORIGINAL LOGIC) ---
        socket.on('addComment', async (data, callback) => {
            try {
                const { postId, content } = data;
                if (!content || !postId) return callback({ success: false, error: 'Content and postId required' });
                
                const comment = await Comment.create({
                    post: postId,
                    user: userId,
                    content,
                    parentComment: null // Keeping your "Flat Forum" logic
                });
                await comment.populate('user', 'name email picture');
                await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
                
                io.to(`post:${postId}`).emit('newComment', comment);
                io.emit('commentAdded', { 
                    postId, 
                    commentCount: await Comment.countDocuments({ post: postId }) 
                });
                callback({ success: true, comment });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        socket.on('upvoteComment', async (commentId, callback) => {
            try {
                const comment = await Comment.findById(commentId);
                if (!comment) return callback({ success: false, error: 'Comment not found' });
                comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
                const hasUpvoted = comment.upvotes.some(id => id.toString() === userId);
                if (hasUpvoted) {
                    comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
                } else {
                    comment.upvotes.push(userId);
                }
                await comment.save();
                io.to(`post:${comment.post}`).emit('commentVoteUpdate', {
                    commentId,
                    upvotes: comment.upvotes.length,
                    downvotes: comment.downvotes.length
                });
                callback({ success: true, upvotes: comment.upvotes.length });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        socket.on('deleteComment', async (commentId, callback) => {
            try {
                const comment = await Comment.findOne({ _id: commentId, user: userId });
                if (!comment) return callback({ success: false, error: 'Comment not found or unauthorized' });
                const postId = comment.post;
                await Comment.deleteOne({ _id: commentId });
                await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
                io.to(`post:${postId}`).emit('commentDeleted', commentId);
                callback({ success: true });
            } catch (error) {
                callback({ success: false, error: error.message });
            }
        });

        // --- 6. TYPING INDICATORS (YOUR ORIGINAL LOGIC) ---
        socket.on('typing', (postId) => {
            socket.to(`post:${postId}`).emit('userTyping', { userId, postId });
        });

        socket.on('stopTyping', (postId) => {
            socket.to(`post:${postId}`).emit('userStoppedTyping', { userId, postId });
        });

        // --- 7. DISCONNECT (YOUR LOGIC FIXED) ---
        socket.on('disconnect', () => {
            if (userId) {
                activeUsers.delete(userId);
                // Corrected the broadcast logic
                io.emit('userStatusUpdate', { userId, status: 'offline' });
                console.log('👋 User disconnected:', socket.id);
            }
        });
    });
}