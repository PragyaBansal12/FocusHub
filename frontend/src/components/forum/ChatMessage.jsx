import React from 'react';

export default function ChatMessage({ comment, isMe }) {
  // Use the profilePicture field from the database
  const profilePic = comment.user?.profilePicture;
  const userName = comment.user?.name || "User";

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Sender's Profile Photo */}
        <div className="flex-shrink-0 mt-1">
          {profilePic ? (
            <img 
              src={profilePic} 
              className="w-8 h-8 rounded-full border border-gray-200 object-cover" 
              alt={userName} 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold uppercase">
              {userName.charAt(0)}
            </div>
          )}
        </div>

        {/* Message Bubble & Info */}
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && (
            <span className="text-[10px] text-gray-500 ml-1 mb-1 font-medium">
              {userName}
            </span>
          )}
          
          <div className={`px-4 py-2 rounded-2xl shadow-sm relative group ${
            isMe 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-[#1e1f26] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-800'
          }`}>
            <p className="text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          {/* Message Timestamp */}
          <span className="text-[9px] mt-1 text-gray-400 px-1 italic">
            {new Date(comment.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
}