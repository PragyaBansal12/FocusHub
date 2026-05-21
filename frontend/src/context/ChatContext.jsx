import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within ChatProvider');
    return context;
};

export function ChatProvider({ children }) {
    const { user } = useAuth();

    // Community chat messages (public broadcast room)
    const [communityMessages, setCommunityMessages] = useState([]);

    // Private DMs — keyed by partner userId: { "userId": [msg, msg] }
    const [privateMessages, setPrivateMessages] = useState({});

    const [students, setStudents] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [loading, setLoading] = useState(false);

    const socketRef = useRef(null);

    const getMyId = useCallback(() => user?.id || user?._id, [user]);

    // Clear unread badge when a student is opened
    useEffect(() => {
        if (selectedStudent?._id) {
            setUnreadCounts(prev => ({ ...prev, [selectedStudent._id]: 0 }));
        }
    }, [selectedStudent]);

    // ─── Fetch all students (for DM sidebar) ───────────────────────────────
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

    // ─── Fetch DM history with one user ────────────────────────────────────
    const fetchChatHistory = useCallback(async (otherUserId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/messages/history/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPrivateMessages(prev => ({ ...prev, [otherUserId]: data }));
            }
        } catch (error) { console.error('Error fetching chat history:', error); }
    }, []);

    // ─── Fetch community chat history from REST API ─────────────────────────
    const fetchCommunityMessages = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/community/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCommunityMessages(data.messages || []);
            }
        } catch (error) { console.error('Error fetching community messages:', error); }
        finally { setLoading(false); }
    }, []);

    // ─── Socket setup ───────────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            if (socketRef.current) socketRef.current.disconnect();
            return;
        }

        socketRef.current = io('http://localhost:5000', { auth: { token } });
        const socket = socketRef.current;

        socket.on('connect', () => {
            socket.emit('joinCommunity');
        });

        // Community broadcast message
        socket.on('receiveCommunityMessage', (message) => {
            setCommunityMessages(prev => {
                if (prev.find(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        });

        // Private DM received
        socket.on('receivePrivateMessage', (message) => {
            const myId = String(getMyId());
            const senderId = String(message.sender?._id || message.sender);
            const recipientId = String(message.recipient?._id || message.recipient);
            const partnerId = senderId === myId ? recipientId : senderId;

            setPrivateMessages(prev => {
                const currentChat = prev[partnerId] || [];
                if (currentChat.find(m => m._id === message._id)) return prev;
                return { ...prev, [partnerId]: [...currentChat, message] };
            });
        });

        // Unread badge for DMs
        socket.on('newMessageNotification', ({ senderId }) => {
            if (String(selectedStudent?._id) !== String(senderId)) {
                setUnreadCounts(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
            }
        });

        // Online presence
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

        return () => {
            socket.emit('leaveCommunity');
            socket.disconnect();
        };
    }, [user, getMyId, selectedStudent]);

    // ─── Actions ────────────────────────────────────────────────────────────
    const sendPrivateMessage = useCallback((recipientId, text) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject(new Error('Socket disconnected'));
            socketRef.current.emit('sendPrivateMessage', { recipientId, text }, (res) => {
                if (res.success) {
                    setPrivateMessages(prev => ({
                        ...prev,
                        [recipientId]: [...(prev[recipientId] || []), res.message]
                    }));
                    resolve(res.message);
                } else reject(new Error(res.error));
            });
        });
    }, []);

    const sendCommunityMessage = useCallback((text) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject(new Error('Socket disconnected'));
            socketRef.current.emit('sendCommunityMessage', { text }, (res) => {
                if (res.success) resolve(res.message);
                else reject(new Error(res.error));
            });
        });
    }, []);

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (user) {
            fetchStudents();
            fetchCommunityMessages();
        }
    }, [user, fetchStudents, fetchCommunityMessages]);

    const value = {
        communityMessages,
        privateMessages,
        students,
        onlineUsers,
        selectedStudent, setSelectedStudent,
        unreadCounts,
        loading,
        fetchChatHistory,
        sendPrivateMessage,
        sendCommunityMessage,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
