import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Calendar, Clock, Users, Link as LinkIcon, Sparkles } from 'lucide-react';

export const ScheduleMeetingModal = ({ isOpen, onClose, onMeetingScheduled, contact }) => {
  const [title, setTitle] = useState(contact ? `Sync Meeting with ${contact.name}` : 'Team Strategy & Operations Review');
  const [date, setDate] = useState('2026-08-28');
  const [time, setTime] = useState('16:00');
  const [reminder, setReminder] = useState('15');
  const [generatedLink] = useState(`https://meet.cgxptech.com/room-${Math.random().toString(36).substring(7)}`);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    if (onMeetingScheduled) {
      onMeetingScheduled({
        title,
        date,
        time,
        reminder,
        link: generatedLink,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Workspace Meeting" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            placeholder="e.g. Operations & Sprint Planning"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Time</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Reminder Notice</label>
          <select
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Video Meeting Room Link</label>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800">
            <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-mono text-[11px] truncate flex-1 font-semibold">{generatedLink}</span>
          </div>
        </div>

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
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/20"
          >
            Schedule & Notify Participant
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleMeetingModal;
