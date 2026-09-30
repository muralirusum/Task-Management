import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ProfileDrawer } from '../components/communication/ProfileDrawer';
import { CallModal } from '../components/communication/CallModal';
import { ScheduleMeetingModal } from '../components/communication/ScheduleMeetingModal';
import { SearchMessages } from '../components/communication/SearchMessages';
import { PinnedMessages } from '../components/communication/PinnedMessages';
import { GroupChatModal } from '../components/communication/GroupChatModal';

import {
  MessageSquare,
  Search,
  Send,
  User,
  Users,
  Building2,
  Paperclip,
  Phone,
  Video,
  Sparkles,
  Circle,
  Clock,
  RefreshCw,
  Plus,
  Smile,
  Mic,
  Pin,
  X,
  CheckCheck,
  Check,
  MoreVertical,
  Calendar,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Edit2,
  CornerUpLeft,
  Copy,
  FolderKanban,
  Megaphone,
  Bell,
  ExternalLink,
  Maximize2
} from 'lucide-react';

export const CommunicationPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Interactive Chat State
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Lightbox Preview Modal for Images & Files
  const [previewFile, setPreviewFile] = useState(null);

  // Modals & Drawers
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Channels state
  const [channels] = useState([
    { id: 'ch_announcements', name: 'Announcements', icon: Megaphone, type: 'channel', department: 'Executive' },
    { id: 'ch_general', name: 'General Workspace', icon: MessageSquare, type: 'channel', department: 'Organization' },
    { id: 'ch_management', name: 'Management Lead', icon: Building2, type: 'channel', department: 'Management' },
    { id: 'ch_operations', name: 'Operations Team', icon: Users, type: 'channel', department: 'Operations' },
    { id: 'ch_projects', name: 'Current Projects', icon: FolderKanban, type: 'channel', department: 'Projects' },
  ]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recent conversation summaries
  const fetchConversationsSummary = async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.success && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations summary:', err);
    }
  };

  // Fetch directory contacts
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const [usersRes, convsRes] = await Promise.all([
        api.get('/users?forChat=true'),
        api.get('/messages/conversations')
      ]);

      let convsMap = {};
      if (convsRes.success && convsRes.conversations) {
        convsMap = convsRes.conversations;
        setConversations(convsMap);
      }

      if (usersRes.success && Array.isArray(usersRes.users)) {
        const otherUsers = usersRes.users.filter((u) => u._id !== user?._id);

        otherUsers.sort((a, b) => {
          const timeA = convsMap[a._id]?.lastMessageTime ? new Date(convsMap[a._id].lastMessageTime).getTime() : 0;
          const timeB = convsMap[b._id]?.lastMessageTime ? new Date(convsMap[b._id].lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });

        setUsers(otherUsers);

        if (!selectedContact && otherUsers.length > 0) {
          setSelectedContact(otherUsers[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat contacts directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [user]);

  // Fetch messages between user and selectedContact
  const fetchMessagesForContact = async (contactId, isSilent = false) => {
    if (!contactId) return;
    try {
      if (!isSilent) setLoadingMessages(true);
      const res = await api.get(`/messages?contactId=${contactId}`);
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  };

  // Poll for messages every 3 seconds
  useEffect(() => {
    if (!selectedContact?._id) return;

    fetchMessagesForContact(selectedContact._id, false);
    fetchConversationsSummary();

    const interval = setInterval(() => {
      fetchMessagesForContact(selectedContact._id, true);
      fetchConversationsSummary();
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedContact]);

  // Simulate typing status randomly when switching contacts
  useEffect(() => {
    if (selectedContact) {
      setIsTyping(false);
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedContact]);

  // Sort contact list dynamically
  const sortedUsers = [...users].sort((a, b) => {
    const timeA = conversations[a._id]?.lastMessageTime ? new Date(conversations[a._id].lastMessageTime).getTime() : 0;
    const timeB = conversations[b._id]?.lastMessageTime ? new Date(conversations[b._id].lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });

  const filteredUsers = sortedUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'managers') {
      return u.role === 'manager' || u.role === 'middle' || u.level === 2 || u.role === 'ceo' || u.role === 'main' || u.level === 1;
    }
    if (activeTab === 'employees') {
      return u.role === 'employee' || u.role === 'last' || u.level === 3;
    }
    return true;
  });

  const getRoleBadge = (u) => {
    if (!u) return null;
    if (u.role === 'ceo' || u.role === 'main' || u.level === 1) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          CEO
        </span>
      );
    }
    if (u.role === 'manager' || u.role === 'middle' || u.level === 2) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Manager
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Employee
      </span>
    );
  };

  // Upload file to server or encode as data URL
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fileUrl = uploadEvent.target.result;
        const fileType = file.type.startsWith('image/') ? 'image' : 'document';
        const newAttachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: fileUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileType,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && attachments.length === 0) || !selectedContact) return;

    let finalMessageText = messageInput.trim();
    const payloadAttachments = attachments.map((a) => ({
      name: a.name,
      url: a.url,
      fileType: a.fileType,
      size: a.size,
    }));

    if (replyToMessage) {
      finalMessageText = `> Replying to ${replyToMessage.senderName || 'Message'}: "${replyToMessage.text.substring(0, 40)}..."\n${finalMessageText}`;
    }

    setMessageInput('');
    setReplyToMessage(null);
    setAttachments([]);
    setShowEmojiPicker(false);

    try {
      const res = await api.post('/messages', {
        receiverId: selectedContact._id,
        text: finalMessageText,
        attachments: payloadAttachments,
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);

        setConversations((prev) => ({
          ...prev,
          [selectedContact._id]: {
            lastMessage: finalMessageText || (payloadAttachments.length ? `[Attachment: ${payloadAttachments[0].name}]` : 'Message'),
            lastMessageTime: new Date().toISOString(),
            unread: false,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (msgId, emoji) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if ((msg._id || msg.id) === msgId) {
          const reactions = msg.reactions || [];
          return { ...msg, reactions: [...reactions, emoji] };
        }
        return msg;
      })
    );
  };

  const togglePinMessage = (msg) => {
    const msgId = msg._id || msg.id;
    if (pinnedMessages.some((m) => (m._id || m.id) === msgId)) {
      setPinnedMessages(pinnedMessages.filter((m) => (m._id || m.id) !== msgId));
    } else {
      setPinnedMessages([...pinnedMessages, msg]);
    }
  };

  const formatMsgTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper to extract legacy attachment string if present
  const extractAttachmentInfo = (text) => {
    if (!text) return null;
    const match = text.match(/\[Attachment:\s*([^\]]+)\]/i);
    if (match) {
      const fileName = match[1].trim();
      const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      return {
        name: fileName,
        isImage: isImg,
        // Demo image fallback for viewing
        url: isImg ? 'https://images.unsplash.com/photo-1542744094-3a31727202b3?auto=format&fit=crop&q=80&w=800' : null,
      };
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-3 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Organization Workspace Communication & Chat
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Slack/Teams Suite
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enterprise real-time messaging between Managers, Employees, and Executive Directors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Group
          </button>

          <button
            onClick={() => fetchDirectory()}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
            {users.length} Active Members Available
          </span>
        </div>
      </div>

      {/* Main Communication Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex min-h-0 relative">
        {/* Left Sidebar: Contacts & Channels */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Managers, Employees & Channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('managers')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'managers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Managers
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'employees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === 'channels' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Channels
              </button>
            </div>
          </div>

          {/* Directory Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {activeTab === 'channels' ? (
              <div className="p-2 space-y-1">
                <p className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Organization Channels
                </p>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    className="w-full p-2.5 rounded-xl text-left flex items-center justify-between hover:bg-slate-200/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ch.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900"># {ch.name}</h4>
                        <p className="text-[10px] text-slate-500">{ch.department} Department</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="animate-spin text-blue-600">⏳</span> Loading team directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No managers or employees matching search.
              </div>
            ) : (
              filteredUsers.map((contact) => {
                const isSelected = selectedContact?._id === contact._id;
                const convInfo = conversations[contact._id];
                const hasLastMsg = convInfo && convInfo.lastMessage;

                return (
                  <button
                    key={contact._id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full p-3 flex items-start gap-3 text-left transition-all hover:bg-slate-100/70 ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                        alt={contact.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{contact.name}</h4>
                        {convInfo?.lastMessageTime ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatMsgTime(convInfo.lastMessageTime)}
                          </span>
                        ) : (
                          getRoleBadge(contact)
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate mb-1">
                        {contact.position || 'Staff'} • {contact.department || 'Operations'}
                      </p>
                      <p className={`text-[11px] truncate ${hasLastMsg ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                        {hasLastMsg ? convInfo.lastMessage : `Click to message ${contact.name.split(' ')[0]}...`}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedContact ? (
            <>
              {/* Upgraded Chat Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
                <button
                  onClick={() => setShowProfileDrawer(true)}
                  className="flex items-center gap-3 text-left hover:bg-slate-100/60 p-1 rounded-xl transition-colors group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedContact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {selectedContact.name}
                      </h3>
                      {getRoleBadge(selectedContact)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{selectedContact.department || 'Operations'} Dept</span>
                      <span>•</span>
                      {isTyping ? (
                        <span className="text-blue-600 font-bold animate-pulse flex items-center gap-1">
                          typing...
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          🟢 Active Now
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCallType('audio');
                      setShowCallModal(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Start Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setCallType('video');
                      setShowCallModal(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Start HD Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Schedule Meeting"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowSearchDrawer(!showSearchDrawer)}
                    className={`p-2 rounded-xl transition-colors ${
                      showSearchDrawer ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Search Messages"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
                    className={`p-2 rounded-xl transition-colors ${
                      showPinnedDrawer ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Pinned Messages"
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowProfileDrawer(true)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="More Profile Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message History Window */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                <div className="flex items-center justify-center my-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                    ──────── Today ────────
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <span className="animate-spin text-blue-600">⏳</span> Loading real message thread...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80 max-w-sm mx-auto shadow-xs">
                    <Sparkles className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">No previous messages</p>
                    <p className="text-[11px] text-slate-500 mt-1">Send a message below to initiate real-time communication with {selectedContact.name}.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSender = (msg.senderId?._id || msg.senderId) === user?._id;
                    const senderName = msg.senderId?.name || (isSender ? user?.name : selectedContact.name);
                    const timeStr = formatMsgTime(msg.createdAt);
                    const isPinned = pinnedMessages.some((m) => (m._id || m.id) === (msg._id || msg.id));
                    const extracted = extractAttachmentInfo(msg.text);

                    return (
                      <div
                        key={msg._id || msg.id}
                        className={`group relative flex flex-col ${isSender ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                      >
                        {/* Hover Actions Toolbar */}
                        <div
                          className={`absolute -top-3 ${
                            isSender ? 'right-0' : 'left-0'
                          } hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-md z-10 text-slate-600 text-xs animate-in zoom-in-95 duration-100`}
                        >
                          <button
                            onClick={() => addReaction(msg._id || msg.id, '👍')}
                            className="hover:bg-slate-100 p-1 rounded-lg"
                            title="React 👍"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => addReaction(msg._id || msg.id, '❤️')}
                            className="hover:bg-slate-100 p-1 rounded-lg"
                            title="React ❤️"
                          >
                            ❤️
                          </button>
                          <button
                            onClick={() => addReaction(msg._id || msg.id, '😂')}
                            className="hover:bg-slate-100 p-1 rounded-lg"
                            title="React 😂"
                          >
                            😂
                          </button>
                          <button
                            onClick={() => setReplyToMessage(msg)}
                            className="hover:bg-slate-100 p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold text-slate-700"
                            title="Reply"
                          >
                            <CornerUpLeft className="w-3 h-3" /> Reply
                          </button>
                          <button
                            onClick={() => togglePinMessage(msg)}
                            className={`hover:bg-slate-100 p-1.5 rounded-lg text-[10px] font-bold ${
                              isPinned ? 'text-amber-600' : 'text-slate-700'
                            }`}
                            title="Pin Message"
                          >
                            <Pin className="w-3 h-3" /> {isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        </div>

                        {/* Author & Timestamp Header */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">{senderName}</span>
                          <span className="text-[10px] font-medium text-slate-400">{timeStr}</span>
                          {isSender && <CheckCheck className="w-3.5 h-3.5 text-blue-500" title="Delivered ✓✓" />}
                        </div>

                        {/* Message Bubble Content */}
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                            isSender
                              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                          }`}
                        >
                          <div>{msg.text}</div>

                          {/* Render Real DB Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-black/10">
                              {msg.attachments.map((att, attIdx) => (
                                <div
                                  key={attIdx}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                    isSender ? 'bg-blue-700/80 border-blue-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-white/20 text-white font-bold">
                                      {att.fileType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs truncate">{att.name}</p>
                                      <p className="text-[10px] opacity-80">{att.size || 'Attachment'}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      onClick={() => setPreviewFile({ name: att.name, url: att.url, type: att.fileType })}
                                      className="px-2.5 py-1 rounded-lg bg-white text-slate-800 text-[10px] font-extrabold hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-xs"
                                    >
                                      <Eye className="w-3 h-3 text-blue-600" /> Open / Preview
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render Extracted Text Attachment Card (Fallback for string attachments) */}
                          {extracted && (
                            <div
                              className={`mt-2 p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                isSender ? 'bg-blue-700/80 border-blue-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-lg bg-white/20 text-white font-bold">
                                  {extracted.isImage ? <ImageIcon className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs truncate">{extracted.name}</p>
                                  <p className="text-[10px] opacity-80">Ready to view & download</p>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  setPreviewFile({
                                    name: extracted.name,
                                    url: extracted.url || 'https://images.unsplash.com/photo-1542744094-3a31727202b3?auto=format&fit=crop&q=80&w=800',
                                    type: extracted.isImage ? 'image' : 'document',
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-white text-blue-700 text-[11px] font-extrabold hover:bg-slate-100 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Open Attachment
                              </button>
                            </div>
                          )}

                          {/* Reaction Pills */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 pt-1 border-t border-white/20">
                              {msg.reactions.map((r, rIdx) => (
                                <span key={rIdx} className="text-xs bg-black/10 px-1.5 py-0.5 rounded-full">
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quoted Reply Preview Bar */}
              {replyToMessage && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-800">Replying to {replyToMessage.senderName || 'Message'}</span>
                    <p className="text-[11px] text-slate-600 truncate max-w-md">"{replyToMessage.text}"</p>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attachment Preview Bar */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] truncate max-w-[120px]">{att.name}</p>
                        <p className="text-[9px] text-slate-400">{att.size}</p>
                      </div>
                      <button
                        onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upgraded Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Attach Documents / Images"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Add Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-14 left-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-xl flex items-center gap-2 z-20">
                    {['😊', '👍', '❤️', '👏', '🎉', '🚀', '🔥', '✅'].map((emo) => (
                      <button
                        type="button"
                        key={emo}
                        onClick={() => {
                          setMessageInput((prev) => prev + emo);
                          setShowEmojiPicker(false);
                        }}
                        className="text-lg p-1.5 hover:bg-slate-100 rounded-xl"
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  placeholder={`Type a message to ${selectedContact.name}... (Press Enter to send)`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />

                <button
                  type="button"
                  onClick={() => setMessageInput((prev) => `${prev} 🎤 [Voice Message 0:12]`)}
                  className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Send Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!messageInput.trim() && attachments.length === 0}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-700 text-sm">Start a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Connect with your managers, employees, and team members in real time.</p>
              <button
                onClick={() => setShowGroupModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                Start New Conversation
              </button>
            </div>
          )}
        </div>

        {/* Side Drawers */}
        <SearchMessages
          isOpen={showSearchDrawer}
          onClose={() => setShowSearchDrawer(false)}
          messages={messages}
        />

        <PinnedMessages
          isOpen={showPinnedDrawer}
          onClose={() => setShowPinnedDrawer(false)}
          pinnedMessages={pinnedMessages}
          onUnpin={togglePinMessage}
        />
      </div>

      {/* Lightbox / File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm truncate">{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[250px] max-h-[400px] overflow-hidden">
              {previewFile.type === 'image' || previewFile.url ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[350px] w-auto object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">{previewFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Corporate Workspace Document Preview</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Close Preview
              </button>
              <a
                href={previewFile.url || '#'}
                download={previewFile.name}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Profile Drawers */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        contact={selectedContact}
        onStartCall={(type) => {
          setCallType(type);
          setShowCallModal(true);
        }}
      />

      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        contact={selectedContact}
        callType={callType}
      />

      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        contact={selectedContact}
      />

      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        users={users}
        onCreateGroup={(groupData) => {
          alert(`Created new ${groupData.type} group "${groupData.name}"!`);
        }}
      />
    </div>
  );
};

export default CommunicationPage;
