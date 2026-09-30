import React from 'react';
import { X, Pin, PinOff, MessageSquare } from 'lucide-react';

export const PinnedMessages = ({ isOpen, onClose, pinnedMessages = [], onUnpin, onJumpToMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-slate-200 bg-white h-full flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Pinned Messages ({pinnedMessages.length})
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pinnedMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Pin className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No pinned messages</p>
            <p className="text-[11px] text-slate-400 mt-1">Hover over any message and click "Pin" to save important notes here.</p>
          </div>
        ) : (
          pinnedMessages.map((msg) => (
            <div key={msg._id || msg.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 relative group">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-bold text-slate-800">{msg.senderName || 'Sender'}</span>
                <button
                  onClick={() => onUnpin && onUnpin(msg._id || msg.id)}
                  className="text-rose-600 hover:text-rose-800 p-0.5"
                  title="Unpin Message"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-800 font-medium">{msg.text}</p>
              <button
                onClick={() => onJumpToMessage && onJumpToMessage(msg._id || msg.id)}
                className="text-[10px] font-bold text-blue-600 hover:underline pt-1 block"
              >
                Jump to message →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PinnedMessages;
