import React from 'react';
import { ThumbsUp } from 'lucide-react';

export default function ChatMessage({ comment, isMe }) {
  return (
    
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {comment.user.picture ? (
            <img src={comment.user.picture} className="w-8 h-8 rounded-full border border-gray-200" alt="user" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
              {comment.user.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && <span className="text-[10px] text-gray-500 ml-1 mb-1">{comment.user.name}</span>}
          
          <div className={`px-4 py-2 rounded-2xl shadow-sm relative group ${
            isMe 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-[#1e1f26] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-800'
          }`}>
            <p className="text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          <span className="text-[9px] mt-1 text-gray-400 px-1">
            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}