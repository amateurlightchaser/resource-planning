'use client';

import { useEffect, useState } from 'react';

type Project = { id: string; name: string; status: 'planned' | 'active' | 'done'; startDate?: string | null; endDate?: string | null; color: string };
type Assignment = { projectId: string; personId: string; allocationHoursPerDay: number };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const load = async () => {
    const [p, a] = await Promise.all([fetch('/api/projects'), fetch('/api/assignments')]);
    setProjects(await p.json());
    setAssignments(await a.json());
  };

  useEffect(() => { load(); }, []);

  const addProject = async () => {
    const name = prompt('Project name');
    if (!name) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color: '#2563eb', status: 'planned' }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Projects</h2><button className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={addProject}>Add project</button></div>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th>Status</th><th>Date range</th><th>Team members</th><th>Total assigned hours</th><th /></tr></thead>
          <tbody>
            {projects.map((project) => {
              const a = assignments.filter((x) => x.projectId === project.id);
              return <tr key={project.id} className="border-t"><td className="p-3"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}</td><td>{project.status}</td><td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</td><td>{new Set(a.map((x) => x.personId)).size}</td><td>{a.reduce((acc, x) => acc + x.allocationHoursPerDay, 0)}h/day</td><td><button className="text-blue-600" onClick={async () => { await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true, status: 'done' }) }); load(); }}>Archive</button></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
