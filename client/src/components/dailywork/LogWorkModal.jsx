import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { Plus, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const LogWorkModal = ({ isOpen, onClose, onWorkLogged, initialTaskId = null }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    durationMinutes: 150,
    taskId: initialTaskId || '',
    project: 'General Operations',
    product: 'NovaCRM',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      const loadTasks = async () => {
        try {
          const res = await api.get('/tasks');
          if (res.success && res.tasks) {
            setTasks(res.tasks);
          }
        } catch (err) {
          console.error('Failed to load tasks for daily work', err);
        }
      };
      loadTasks();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('Please fill in title and work times');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/daily-work', formData);
      if (res.success) {
        if (onWorkLogged) onWorkLogged(res.entry);
        onClose();
        setFormData({
          title: '',
          description: '',
          startTime: '09:00 AM',
          endTime: '11:30 AM',
          durationMinutes: 150,
          taskId: '',
          project: 'General Operations',
          product: 'NovaCRM',
          notes: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to log daily work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Daily Work Activity" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Work Title / Action Taken <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Collected monthly sales data from CRM"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Linked Task */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Related Task (Optional)</label>
          <select
            value={formData.taskId}
            onChange={(e) => {
              const selectedTask = tasks.find((t) => t._id === e.target.value);
              setFormData({
                ...formData,
                taskId: e.target.value,
                project: selectedTask ? selectedTask.project : formData.project,
                product: selectedTask ? selectedTask.product : formData.product,
              });
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- No specific task linked --</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {/* 3-col: Start Time, End Time, Duration */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
            <input
              type="text"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="09:00 AM"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
            <input
              type="text"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              placeholder="11:30 AM"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (mins)</label>
            <input
              type="number"
              min="5"
              step="5"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Breakdown & Notes</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Details of what was achieved during this time block..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Work Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Footer */}
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
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading ? 'Saving...' : 'Save Daily Work Log'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
