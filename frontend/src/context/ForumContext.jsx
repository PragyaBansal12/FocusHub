import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const ForumContext = createContext(null);

export const useForum = () => {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error('useForum must be used within ForumProvider');
  }
  return context;
};

export function ForumProvider({ children }) {
  // ============================================
  // STATE (ALL ORIGINAL LOGIC PRESERVED)
  // ============================================
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Community & DM Features
  const [students, setStudents] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [privateMessages, setPrivateMessages] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  
  // Socket.IO
  const socketRef = useRef(null);
  const isConnected = useRef(false);

  // ============================================
  // API FUNCTIONS FOR STUDENTS & DMs (UNCHANGED)
  // ============================================
  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  const fetchChatHistory = useCallback(async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/messages/history/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPrivateMessages(data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, []);

  // ============================================
  // SOCKET.IO CONNECTION & LISTENERS (UNCHANGED)
  // ============================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', { auth: { token } });
    }
    const socket = socketRef.current;

    socket.on('connect', () => { 
      console.log('✅ Socket connected:', socket.id);
      isConnected.current = true; 
    });
    socket.on('disconnect', () => { 
      console.log('❌ Socket disconnected');
      isConnected.current = false; 
    });

    socket.on('newPost', (post) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('postVoteUpdate', ({ postId, upvotes, downvotes }) => {
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, upvoteCount: upvotes, downvoteCount: downvotes, voteScore: upvotes - downvotes }
          : post
      ));
      setCurrentPost(prev => (prev?._id === postId 
        ? { ...prev, upvoteCount: upvotes, downvoteCount: downvotes, voteScore: upvotes - downvotes }
        : prev
      ));
    });

    socket.on('postDeleted', (postId) => {
      setPosts(prev => prev.filter(post => post._id !== postId));
    });

    socket.on('postUpdated', (updatedPost) => {
      setPosts(prev => prev.map(post => post._id === updatedPost._id ? updatedPost : post));
    });

    socket.on('newComment', (comment) => {
      setComments(prev => [...prev, comment]);
    });

    socket.on('commentVoteUpdate', ({ commentId, upvotes, downvotes }) => {
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? { ...comment, upvoteCount: upvotes, downvoteCount: downvotes, voteScore: upvotes - downvotes }
          : comment
      ));
    });

    socket.on('commentDeleted', (commentId) => {
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    });

    socket.on('commentAdded', ({ postId, commentCount }) => {
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, commentCount } : post));
    });

    socket.on('userStatusUpdate', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        status === 'online' ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    socket.on('initialOnlineUsers', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('receivePrivateMessage', (message) => {
      setPrivateMessages((prev) => {
        const exists = prev.find(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newPost');
      socket.off('postVoteUpdate');
      socket.off('postDeleted');
      socket.off('postUpdated');
      socket.off('newComment');
      socket.off('commentVoteUpdate');
      socket.off('commentDeleted');
      socket.off('commentAdded');
      socket.off('userStatusUpdate');
      socket.off('initialOnlineUsers');
      socket.off('receivePrivateMessage');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ============================================
  // UPDATED: AUTO-LOAD COMMUNITY DISCUSSION
  // ============================================
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetches the single main discussion from the backend
      const res = await fetch(`http://localhost:5000/api/forum/posts`);
      const data = await res.json();
      if (res.ok) {
        // We set currentPost so the UI knows we are in the main room
        setCurrentPost(data.post);
        setComments(data.comments);
        // Automatically join the socket room for this post
        if (socketRef.current && data.post?._id) {
          socketRef.current.emit('joinPost', data.post._id);
        }
      }
    } catch (error) {
      console.error('Error fetching forum:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPost = useCallback(async (postId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/forum/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
        setComments(data.comments);
        setSelectedStudent(null); 
        if (socketRef.current) {
          socketRef.current.emit('joinPost', postId);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/forum/tags/trending');
      const data = await res.json();
      if (res.ok) setTrendingTags(data.tags);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  }, []);

  // ============================================
  // SOCKET ACTIONS (UNCHANGED)
  // ============================================
  const sendPrivateMessage = useCallback((recipientId, text) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket disconnected'));
      socketRef.current.emit('sendPrivateMessage', { recipientId, text }, (res) => {
        if (res.success) {
          setPrivateMessages(prev => [...prev, res.message]);
          resolve(res.message);
        } else reject(new Error(res.error));
      });
    });
  }, []);

  const upvotePost = useCallback((postId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return;
      socketRef.current.emit('upvotePost', postId, (res) => res.success ? resolve(res) : reject(new Error(res.error)));
    });
  }, []);

  const downvotePost = useCallback((postId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return;
      socketRef.current.emit('downvotePost', postId, (res) => res.success ? resolve(res) : reject(new Error(res.error)));
    });
  }, []);

  const addComment = useCallback((postId, content, parentCommentId = null) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return;
      socketRef.current.emit('addComment', { postId, content, parentCommentId }, (res) => {
        if (res.success) resolve(res.comment);
        else reject(new Error(res.error));
      });
    });
  }, []);

  const upvoteComment = useCallback((commentId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return;
      socketRef.current.emit('upvoteComment', commentId, (res) => res.success ? resolve(res) : reject(new Error(res.error)));
    });
  }, []);

  const deleteComment = useCallback((commentId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return;
      socketRef.current.emit('deleteComment', commentId, (res) => res.success ? resolve() : reject(new Error(res.error)));
    });
  }, []);

  const leavePost = useCallback((postId) => {
    if (socketRef.current) socketRef.current.emit('leavePost', postId);
  }, []);

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    fetchPosts(); // Load Community Chat
    fetchTrendingTags();
    fetchStudents(); // Load DM list & Online Status
  }, [fetchPosts, fetchTrendingTags, fetchStudents]);

  // ============================================
  // CONTEXT VALUE (ALL ORIGINAL VALUES EXPORTED)
  // ============================================
  const value = {
    posts, currentPost, comments, loading, trendingTags, hasMore, 
    students, onlineUsers, privateMessages, selectedStudent,
    setSelectedStudent, fetchChatHistory, sendPrivateMessage,
    searchQuery, setSearchQuery, selectedTag, setSelectedTag, sortBy, setSortBy,
    fetchPosts, fetchPost, upvotePost, downvotePost, addComment, 
    upvoteComment, deleteComment, leavePost, isConnected: isConnected.current
  };

  return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>;
}