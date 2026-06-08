import { useState, useEffect } from 'react';
import { getProjects, createProject } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    getProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setAdding(false);
    try {
      const name = newProjectName;
      setNewProjectName('');
      await createProject(name);
      fetchProjects();
    } catch (err) {
      console.error(err);
      fetchProjects();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Projects</h1>
          <p className="text-on-surface-variant font-body-md">Manage environments and logical groupings of your integration.</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Project
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, color: 'text-status-protected', bar: 'bg-status-protected', w: '100%' },
          { label: 'Total API Checks', value: projects.reduce((a, p) => a + (p.checksThisMonth || 0), 0).toLocaleString(), color: 'text-secondary', bar: 'bg-secondary', w: '48%' },
          { label: 'Current Plan', value: projects[0]?.plan || 'Growth', color: 'text-primary', bar: 'bg-primary', w: '60%' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{m.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary">{m.value}</h4>
              <span className={`${m.color} font-bold text-code-sm`}>this month</span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className={`${m.bar} h-full`} style={{ width: m.w }} />
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="bg-white border border-border-subtle rounded-xl p-8 mb-8">
          <h3 className="font-headline-sm text-[18px] mb-6">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="flex gap-4 max-w-lg">
            <input
              required
              className="flex-1 h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              placeholder="Project Name (e.g. Production API)"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
            <button type="submit" className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors">
              Create Project
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-6 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-border-subtle rounded-xl">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-border-subtle rounded-xl p-8 hover:border-secondary transition-all group relative overflow-hidden cursor-pointer">
              {/* Architectural detail */}
              <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                <div className="grid grid-cols-4 h-full border-l border-primary">
                  <div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" />
                </div>
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container-low border border-border-subtle rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">folder</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-[18px] text-on-surface">{p.name}</h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1">{p.plan} Plan</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${p.status === 'active' ? 'bg-status-protected/10 text-status-protected border-status-protected/20' : 'bg-surface-container text-on-surface-variant border-border-subtle'}`}>
                  {p.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase">API Key</p>
                  <p className="text-code-sm font-mono bg-surface-container-low border border-border-subtle px-4 py-2.5 rounded-lg text-on-surface-variant truncate">
                    {p.apiKey?.slice(0, 24)}••••
                  </p>
                </div>
                <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">API Checks This Month</p>
                    <p className="text-code-sm font-bold text-on-surface">{(p.checksThisMonth || 0).toLocaleString()}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add new project card */}
          <div
            onClick={() => setAdding(true)}
            className="bg-white border border-dashed border-border-subtle rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-secondary hover:bg-surface-container-lowest transition-all cursor-pointer group min-h-[200px]"
          >
            <div className="w-12 h-12 bg-surface-container-low border border-border-subtle rounded-xl flex items-center justify-center group-hover:bg-secondary/10 group-hover:border-secondary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">add</span>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-secondary transition-colors">Add New Project</p>
          </div>
        </div>
      )}
    </div>
  );
}
