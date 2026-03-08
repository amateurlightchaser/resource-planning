'use client';

import { useEffect, useMemo, useState } from 'react';

type Project = { id: string; name: string; startDate?: string | null; endDate?: string | null; status: string; color: string };
type Assignment = { id: string; projectId: string; person: { name: string }; startDateTime: string; endDateTime: string; allocationHoursPerDay: number; personId: string };
type Person = { id: string; name: string };

export default function ProjectPlanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<string>('');

  const load = async () => {
    const [proj, peopleRes, assign] = await Promise.all([fetch('/api/projects'), fetch('/api/people'), fetch('/api/assignments')]);
    const projectData = await proj.json();
    setProjects(projectData);
    setPeople(await peopleRes.json());
    setAssignments(await assign.json());
    if (!selected && projectData[0]) setSelected(projectData[0].id);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => assignments.filter((a) => a.projectId === selected), [assignments, selected]);
  const project = projects.find((p) => p.id === selected);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Project Plan</h2>
      <select className="rounded border bg-white p-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {project && <div className="grid grid-cols-3 gap-3"><div className="rounded border bg-white p-3">People: {new Set(data.map((d) => d.personId)).size}</div><div className="rounded border bg-white p-3">Assigned: {data.reduce((acc, d) => acc + d.allocationHoursPerDay, 0)} h/day</div><div className="rounded border bg-white p-3">Date range: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</div></div>}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex justify-end"><button className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={async () => {
          const personId = prompt('Person ID');
          if (!personId || !selected) return;
          await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId, projectId: selected, startDateTime: new Date().toISOString(), endDateTime: new Date(Date.now() + 86400000).toISOString(), allocationHoursPerDay: 8 }) });
          load();
        }}>Add assignment</button></div>
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="rounded border-l-4 bg-slate-50 p-3" style={{ borderColor: project?.color }}>
              <div className="font-medium">{a.person.name}</div>
              <div className="text-sm text-slate-600">{new Date(a.startDateTime).toLocaleDateString()} → {new Date(a.endDateTime).toLocaleDateString()} · {a.allocationHoursPerDay}h/day</div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-xs text-slate-500">People IDs: {people.map((p) => `${p.name}:${p.id.slice(0, 6)}`).join(', ')}</div>
    </div>
  );
}
