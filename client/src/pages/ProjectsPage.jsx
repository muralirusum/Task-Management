import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import {
  FolderKanban,
  Layers,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';

export const ProjectsPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tasks');
        if (res.success) {
          setTasks(res.tasks || []);
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [user?._id]);

  // Group tasks by Product
  const productsMap = {};
  tasks.forEach((t) => {
    const p = t.product || 'NovaCRM';
    if (!productsMap[p]) productsMap[p] = [];
    productsMap[p].push(t);
  });



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Products, Projects & Campaigns</h2>
        <p className="text-xs text-slate-400 mt-1">
          Work streams associated with NovaTech software products and business initiatives
        </p>
      </div>

      {/* Products Grid */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Product Portfolios
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'cGxP Wire', suffix: 'Wire', url: 'https://cgxpwire.com/' },
            { name: 'cGxP Jobs', suffix: 'Jobs', url: 'https://cgxpjobs.com/' },
            { name: 'cGxP Directory', suffix: 'Directory', url: 'https://cgxp.directory/' },
          ].map((product) => {
            // Randomly map existing tasks for demo purposes or show 0 if preferred.
            // Let's just group tasks that contain similar keywords or just map them.
            const prodTasks = tasks.filter(t => t.product === product.name) || [];
            const completed = prodTasks.filter((t) => t.status === 'Completed').length;
            const hours = prodTasks.reduce((acc, c) => acc + (c.actualHours || 0), 0);

            return (
              <a
                key={product.name}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#2264ad] hover:-translate-y-1 transition-all space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  {/* CSS Logo Representation */}
                  <div className="flex border-2 border-[#2264ad] rounded-md overflow-hidden">
                    <div className="bg-white px-2 py-1 flex items-center justify-center">
                      <span className="text-[#2264ad] font-bold text-lg tracking-tight">cGxP</span>
                    </div>
                    <div className="bg-[#2264ad] px-2 py-1 flex items-center justify-center relative">
                      <div className="absolute left-[-3px] top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      <span className="text-white font-bold text-lg tracking-tight ml-0.5">{product.suffix}</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold text-[#2264ad] bg-blue-50 px-2 py-1 rounded-md border border-blue-100 group-hover:bg-[#2264ad] group-hover:text-white transition-colors">
                    Visit Site
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Active Tasks:</span>
                    <span className="font-bold text-slate-800">{prodTasks.length} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Completed:</span>
                    <span className="font-bold text-emerald-600">{completed} / {prodTasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Time Invested:</span>
                    <span className="font-bold text-slate-800">{hours.toFixed(1)} hours</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>


      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
};
