import React, { useState } from 'react';
import { X, Search, ChevronRight, MessageSquare } from 'lucide-react';

export const SearchMessages = ({ isOpen, onClose, messages, onSelectMessage }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = messages.filter((m) =>
    m.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-80 border-l border-slate-200 bg-white h-full flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          Search Conversation
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords in chat..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!query ? (
          <p className="text-[11px] text-slate-400 text-center py-6">Type a keyword above to search message history.</p>
        ) : results.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-6">No matching messages found for "{query}".</p>
        ) : (
          results.map((msg) => (
            <button
              key={msg._id || msg.id}
              onClick={() => onSelectMessage && onSelectMessage(msg._id || msg.id)}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-colors group"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-bold text-slate-700">{msg.senderName || 'Message'}</span>
                <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-slate-800 line-clamp-2 font-medium">{msg.text}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchMessages;
