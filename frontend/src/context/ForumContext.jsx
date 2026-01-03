import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; 

const ForumContext = createContext(null);

export const useForum = () => {
    const context = useContext(ForumContext);
    if (!context) throw new Error('useForum must be used within ForumProvider');
    return context;
};

export function ForumProvider({ children }) {
    const { user } = useAuth(); 
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    
    // 🔥 FIX 1: Change from [] to {} to separate chats by User ID
    // Format: { "studentId_1": [msg, msg], "studentId_2": [msg] }
    const [privateMessages, setPrivateMessages] = useState({}); 
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [unreadCounts, setUnreadCounts] = useState({});
    
    const socketRef = useRef(null);
    const isConnected = useRef(false);

    const getMyId = useCallback(() => user?.id || user?._id, [user]);

    // Reset unread count when a student is selected
    useEffect(() => {
        if (selectedStudent?._id) {
            setUnreadCounts(prev => ({ ...prev, [selectedStudent._id]: 0 }));
        }
    }, [selectedStudent]);

    const fetchStudents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const myId = getMyId();
                setStudents(data.filter(s => s._id !== myId));
            }
        } catch (error) { console.error('Error fetching students:', error); }
    }, [getMyId]);

    const fetchChatHistory = useCallback(async (otherUserId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/messages/history/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // 🔥 FIX 2: Store history under the specific user's ID key
                setPrivateMessages(prev => ({
                    ...prev,
                    [otherUserId]: data
                }));
            }
        } catch (error) { console.error('Error fetching chat history:', error); }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            if (socketRef.current) socketRef.current.disconnect();
            return;
        }

        socketRef.current = io('http://localhost:5000', { auth: { token } });
        const socket = socketRef.current;

        socket.on('connect', () => { isConnected.current = true; });

        // --- 1. PRIVATE MESSAGES (Isolated Conversations) ---
        socket.on('receivePrivateMessage', (message) => {
            const myId = String(getMyId());
            const senderId = String(message.sender?._id || message.sender);
            const recipientId = String(message.recipient?._id || message.recipient);

            // 🔥 FIX 3: Identify which student this message belongs to
            const partnerId = senderId === myId ? recipientId : senderId;

            setPrivateMessages(prev => {
                const currentChat = prev[partnerId] || [];
                if (currentChat.find(m => m._id === message._id)) return prev;
                return {
                    ...prev,
                    [partnerId]: [...currentChat, message]
                };
            });
        });

        socket.on('newMessageNotification', ({ senderId }) => {
            if (String(selectedStudent?._id) !== String(senderId)) {
                setUnreadCounts(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
            }
        });

        // --- 2. ONLINE STATUS & FORUM ---
        socket.on('userStatusUpdate', ({ userId, status }) => {
            if (userId === getMyId()) return;
            setOnlineUsers(prev => {
                const next = new Set(prev);
                status === 'online' ? next.add(userId) : next.delete(userId);
                return next;
            });
        });

        socket.on('initialOnlineUsers', (userIds) => {
            setOnlineUsers(new Set(userIds.filter(id => id !== getMyId())));
        });

        socket.on('newPost', (post) => setPosts(prev => [post, ...prev]));
        socket.on('newComment', (comment) => setComments(prev => [...prev, comment]));

        return () => socket.disconnect();
    }, [user, getMyId, selectedStudent]);

    const sendPrivateMessage = useCallback((recipientId, text) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject(new Error('Socket disconnected'));
            socketRef.current.emit('sendPrivateMessage', { recipientId, text }, (res) => {
                if (res.success) {
                    // Update local bucket immediately for the recipient
                    setPrivateMessages(prev => ({
                        ...prev,
                        [recipientId]: [...(prev[recipientId] || []), res.message]
                    }));
                    resolve(res.message);
                } else reject(new Error(res.error));
            });
        });
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/forum/posts`);
            const data = await res.json();
            if (res.ok) setComments(data.comments || []);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    }, []);

    const addComment = useCallback((postId, content) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return;
            socketRef.current.emit('addComment', { postId, content }, (res) => {
                if (res.success) resolve(res.comment);
                else reject(new Error(res.error));
            });
        });
    }, []);

    useEffect(() => {
        fetchPosts();
        fetchStudents(); 
    }, [fetchPosts, fetchStudents, user]);

    const value = {
        posts, comments, loading, students, onlineUsers, 
        privateMessages, // Now an Object grouped by user
        selectedStudent, setSelectedStudent, unreadCounts, 
        fetchChatHistory, sendPrivateMessage, addComment
    };

    return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>;
}