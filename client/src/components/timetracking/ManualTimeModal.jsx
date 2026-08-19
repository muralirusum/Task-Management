import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { Clock, CheckCircle2 } from 'lucide-react';

export const ManualTimeModal = ({ isOpen, onClose, onTimeLogged, initialTaskId = null }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    taskId: initialTaskId || '',
    hours: 1,
    minutes: 30,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    if (isOpen) {
      const loadTasks = async () => {
        try {
          const res = await api.get('/tasks');
          if (res.success && res.tasks) {
            setTasks(res.tasks);
            if (res.tasks.length > 0 && !formData.taskId) {
              setFormData((prev) => ({ ...prev, taskId: res.tasks[0]._id }));
            }
          }
        } catch (err) {
          console.error('Failed to load tasks', err);
        }
      };
      loadTasks();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.taskId) {
      alert('Please select a task');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/time/manual', formData);
      if (res.success) {
        if (onTimeLogged) onTimeLogged(res.entry);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to log manual time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Manual Working Hours" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Task <span className="text-rose-400">*</span>
          </label>
          <select
            required
            value={formData.taskId}
            onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hours</label>
            <input
              type="number"
              min="0"
              max="24"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Minutes</label>
            <input
              type="number"
              min="0"
              max="59"
              step="5"
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Work Note</label>
          <input
            type="text"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="e.g. Offline documentation & data review"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
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
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading ? 'Logging...' : 'Add Time Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
