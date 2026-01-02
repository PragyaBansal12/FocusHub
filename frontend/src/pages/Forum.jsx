import React, { useEffect, useState, useRef } from 'react';
import { useForum } from '../context/ForumContext';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/forum/ChatMessage';
import { Send, Users, MessageSquare } from 'lucide-react';

export default function Forum() {
  const { 
    currentPost, 
    comments, 
    addComment, 
    students, 
    onlineUsers,
    selectedStudent, 
    setSelectedStudent, 
    fetchChatHistory, 
    privateMessages, 
    sendPrivateMessage 
  } = useForum();
  
  const { user } = useAuth(); 
  const [msgInput, setMsgInput] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, privateMessages, selectedStudent]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    try {
      if (selectedStudent) {
        // Send DM
        await sendPrivateMessage(selectedStudent._id, msgInput);
      } else if (currentPost) {
        // Send to Community Discussion
        await addComment(currentPost._id, msgInput);
      }
      setMsgInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#0b0f15] overflow-hidden">
      
      {/* 1. SIDEBAR - Restored Full Direct Message Logic */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-[#121318]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-lg text-gray-800 dark:text-white">
          Forum
        </div>
        
        <div className="flex-1 overflow-y-auto pt-2">
          {/* Main Community Room Button */}
          <div 
            onClick={() => setSelectedStudent(null)}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer mx-2 rounded-lg transition-all mb-4 ${
              !selectedStudent 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Users size={18} />
            <span className="text-sm font-medium">Community Chat</span>
          </div>

          <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Direct Messages
          </div>
          
          {/* List of Students with Online Indicators */}
          {students && students.filter(s => s._id !== (user?.id || user?._id)).map(student => (
            <div 
              key={student._id}
              onClick={() => { 
                setSelectedStudent(student); 
                fetchChatHistory(student._id); 
              }}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer mx-2 rounded-lg transition-all mb-1 ${
                selectedStudent?._id === student._id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                  selectedStudent?._id === student._id ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {student.name.charAt(0)}
                </div>
                {/* Online Green Dot */}
                {onlineUsers.has(student._id) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#121318] rounded-full"></div>
                )}
              </div>
              <span className="text-sm font-medium truncate">{student.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#121318] border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">
            {selectedStudent ? selectedStudent.name : "Community Discussion"}
          </h3>
          <p className="text-xs text-gray-500">
            {selectedStudent 
              ? (onlineUsers.has(selectedStudent._id) ? 'Online' : 'Offline') 
              : 'Public Channel'}
          </p>
        </div>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-2 bg-[#f0f2f5] dark:bg-[#0b0f15]">
          {selectedStudent ? (
            // Private Messages View
            privateMessages.map((msg, idx) => {
              const isMe = (msg.sender?._id || msg.sender) === (user?.id || user?._id);
              return (
                <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-[#1c1f26] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          ) : (
            // Community Discussion View (Uses your ChatMessage component)
            comments.map(c => (
              <ChatMessage 
                key={c._id} 
                comment={c} 
                isMe={c.user?._id === (user?.id || user?._id)} 
              />
            ))
          )}
        </div>

        {/* 3. INPUT FOOTER */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-[#121318] border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2 items-center bg-gray-100 dark:bg-[#1a1c23] rounded-xl px-4 py-2">
            <input 
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder={selectedStudent ? `Message ${selectedStudent.name}...` : "Message the community..."}
              className="flex-1 bg-transparent outline-none py-2 text-sm text-gray-800 dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!msgInput.trim()} 
              className="text-blue-600 disabled:opacity-50 hover:scale-110 transition-transform"
            >
              <Send size={22} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}