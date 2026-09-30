import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  ShieldCheck,
  Volume2
} from 'lucide-react';

export const CallModal = ({ isOpen, onClose, contact, callType = 'video' }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !contact) return null;

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainderSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Call Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-slate-300">
              {callType === 'video' ? 'HD Video Meeting' : 'Voice Call'} • Connected
            </span>
          </div>
          <div className="font-mono text-xs font-bold px-3 py-1 bg-slate-800 rounded-full text-emerald-400">
            {formatDuration(seconds)}
          </div>
        </div>

        {/* Video / Audio Screen Container */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
          {isVideoOn ? (
            <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
              <img
                src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'}
                alt={contact.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              {/* Participant Overlay */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center gap-2 text-xs font-bold text-white">
                  <span>{contact.name}</span>
                  <span className="text-[10px] text-slate-400">({contact.department || 'Operations'})</span>
                </div>
              </div>

              {/* My Camera Picture in Picture */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold">You (Self View)</span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt={contact.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 shadow-2xl mx-auto"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">{contact.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{contact.position || 'Staff'} • {contact.department || 'Operations'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Control Toolbar */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3.5 rounded-full text-white transition-all shadow-md ${
              isMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3.5 rounded-full text-white transition-all shadow-md ${
              isVideoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
            title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3.5 rounded-full text-white transition-all shadow-md ${
              isScreenSharing ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 px-6"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
