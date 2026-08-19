import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { SubmitTaskModal } from '../components/tasks/SubmitTaskModal';
import { ReviewTaskModal } from '../components/approvals/ReviewTaskModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DeadlineBadge } from '../components/common/DeadlineBadge';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Kanban,
  CheckCircle,
  Clock,
  Folder,
} from 'lucide-react';

export const TasksPage = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const location = useLocation();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'kanban'

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForSubmit, setTaskForSubmit] = useState(null);
  const [taskForReview, setTaskForReview] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (departmentFilter !== 'All') params.department = departmentFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/tasks', { params });
      if (res.success) {
        setTasks(res.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if url contains filter
    const queryParams = new URLSearchParams(location.search);
    const urlFilter = queryParams.get('filter');
    if (urlFilter === 'submitted') {
      setStatusFilter('Submitted');
    }
  }, [location.search]);

  useEffect(() => {
    fetchTasks();
  }, [user?._id, statusFilter, priorityFilter, departmentFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isMain && 'All Company Tasks'}
            {isMiddle && 'Team Task Management'}
            {isLast && 'My Assigned Tasks'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isMain && 'Monitor, reassign, review, and track deadlines across all departments.'}
            {isMiddle && 'Manage workflows and review submissions for your reporting team.'}
            {isLast && 'Track your assignments, start live timers, and submit deliverables.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          {(isMain || isMiddle) && (
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title or description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted / Review</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {isMain && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
            </select>
          )}
        </div>
      </div>

      {/* Task Content Views */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No tasks found</h4>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => setSelectedTask(task)}
              onSubmitClick={(t) => setTaskForSubmit(t)}
              onReviewClick={(t) => setTaskForReview(t)}
            />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Task Title</th>
                  <th className="px-5 py-3.5">Assignee</th>
                  <th className="px-5 py-3.5">Product / Project</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Deadline</th>
                  <th className="px-5 py-3.5">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {tasks.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">{t.title}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={t.assignedTo?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'}
                          alt={t.assignedTo?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{t.assignedTo?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{t.product} • {t.project}</td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} displayStatus={t.displayStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <DeadlineBadge dueDate={t.dueDate} status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {t.actualHours || 0}h / {t.estimatedHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {[
            { key: 'Assigned', title: 'To Do / Assigned', color: 'border-purple-500/40 text-purple-300' },
            { key: 'In Progress', title: 'In Progress', color: 'border-blue-500/40 text-blue-300' },
            { key: 'Submitted', title: 'Under Review', color: 'border-amber-500/40 text-amber-300' },
            { key: 'Completed', title: 'Completed', color: 'border-emerald-500/40 text-emerald-300' },
          ].map((col) => {
            const colTasks = tasks.filter((t) => {
              if (col.key === 'Submitted') {
                return ['Submitted', 'Under Review', 'Forwarded to Main'].includes(t.status) || t.displayStatus === 'Submitted';
              }
              return t.status === col.key;
            });

            return (
              <div key={col.key} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className={`flex items-center justify-between pb-2 border-b border-slate-800 ${col.color}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{col.title}</h4>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                      onSubmitClick={(t) => setTaskForSubmit(t)}
                      onReviewClick={(t) => setTaskForReview(t)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          fetchTasks();
        }}
        onOpenSubmit={(task) => setTaskForSubmit(task)}
        onOpenReview={(task) => setTaskForReview(task)}
      />

      <SubmitTaskModal
        isOpen={!!taskForSubmit}
        onClose={() => setTaskForSubmit(null)}
        task={taskForSubmit}
        onTaskSubmitted={() => {
          fetchTasks();
        }}
      />

      <ReviewTaskModal
        isOpen={!!taskForReview}
        onClose={() => setTaskForReview(null)}
        task={taskForReview}
        onApprovalComplete={() => {
          fetchTasks();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={() => {
          fetchTasks();
        }}
      />
    </div>
  );
};
