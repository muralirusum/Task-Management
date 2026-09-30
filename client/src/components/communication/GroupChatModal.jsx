import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Users, Building2, FolderKanban, MessageSquare, Check } from 'lucide-react';

export const GroupChatModal = ({ isOpen, onClose, users = [], onCreateGroup }) => {
  const [groupType, setGroupType] = useState('team'); // 'direct', 'team', 'department', 'project'
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  if (!isOpen) return null;

  const toggleUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    if (onCreateGroup) {
      onCreateGroup({
        name: groupName,
        type: groupType,
        memberIds: selectedUserIds,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Conversation / Group" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Group Type Buttons */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Conversation Category</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGroupType('team')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                groupType === 'team'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Team Group</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupType('department')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                groupType === 'department'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Dept Channel</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupType('project')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                groupType === 'project'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-emerald-600" />
              <span>Project Room</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupType('direct')}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                groupType === 'direct'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <span>Direct Chat</span>
            </button>
          </div>
        </div>

        {/* Group Name */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Group / Channel Title</label>
          <input
            type="text"
            placeholder="e.g. Operations Sprint Group"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Select Participants */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Select Participants ({selectedUserIds.length} Selected)
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            {users.map((u) => {
              const isChecked = selectedUserIds.includes(u._id);
              return (
                <button
                  type="button"
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`w-full p-2 rounded-lg flex items-center justify-between transition-colors ${
                    isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=60'} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                    <span className="text-[10px] text-slate-400">({u.department || 'Operations'})</span>
                  </div>
                  {isChecked && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!groupName.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GroupChatModal;
