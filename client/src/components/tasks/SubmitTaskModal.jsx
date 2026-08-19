import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { Send, Paperclip, CheckCircle, FileText } from 'lucide-react';

export const SubmitTaskModal = ({ isOpen, onClose, task, onTaskSubmitted }) => {
  const [notes, setNotes] = useState('Report completed and all metrics verified.');
  const [attachmentName, setAttachmentName] = useState('monthly-report.pdf');
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const attachments = attachmentName.trim()
        ? [
            {
              name: attachmentName,
              url: `https://novatech.local/uploads/${attachmentName}`,
              size: '1.8 MB',
            },
          ]
        : [];

      const res = await api.post(`/tasks/${task._id}/submit`, {
        notes,
        attachments,
      });

      if (res.success) {
        if (onTaskSubmitted) onTaskSubmitted(res.task);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Task for Review" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Submitting Task</p>
          <h4 className="text-sm font-bold text-white mt-1">{task.title}</h4>
          <p className="text-xs text-indigo-400 mt-0.5">Assigned by: {task.assignedBy?.name}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Completion Report / Notes <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the work completed, findings, and any important notes for your manager..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Deliverable Attachment Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g. monthly-sales-report-aug2026.pdf"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Paperclip className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Simulated PDF / Document attachment for your review workflow
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Submitting...' : 'Confirm Submission'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
