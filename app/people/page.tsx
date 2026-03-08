'use client';

import { useEffect, useState } from 'react';

type Person = { id: string; name: string; role: string; team?: string | null; weeklyCapacityHours: number; isActive: boolean };
type Assignment = { personId: string; startDateTime: string; endDateTime: string; allocationHoursPerDay: number; project: { name: string } };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const load = async () => {
    const [peopleRes, assignmentRes] = await Promise.all([fetch('/api/people'), fetch('/api/assignments')]);
    setPeople(await peopleRes.json());
    setAssignments(await assignmentRes.json());
  };

  useEffect(() => { load(); }, []);

  const utilization = (person: Person) => {
    const current = assignments.filter((a) => a.personId === person.id).reduce((acc, a) => acc + a.allocationHoursPerDay, 0);
    const cap = person.weeklyCapacityHours;
    return { current, cap, state: current > cap ? 'over' : current < cap * 0.6 ? 'under' : 'ok' };
  };

  const createPerson = async () => {
    const name = prompt('Name');
    if (!name) return;
    await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role: 'Generalist', weeklyCapacityHours: 40, isActive: true }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">People</h2>
        <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={createPerson}>Add person</button>
      </div>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th>Role</th><th>Team</th><th>Capacity</th><th>Utilization</th><th>Next assignment</th><th /></tr></thead>
          <tbody>
            {people.map((p) => {
              const u = utilization(p);
              const next = assignments.find((a) => a.personId === p.id);
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.name}</td><td>{p.role}</td><td>{p.team ?? '-'}</td><td>{p.weeklyCapacityHours}h/w</td>
                  <td><span className={`rounded px-2 py-1 text-xs ${u.state === 'over' ? 'bg-red-100 text-red-700' : u.state === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{u.current}/{u.cap}h</span></td>
                  <td>{next ? `${next.project.name} (${new Date(next.startDateTime).toLocaleDateString()})` : '-'}</td>
                  <td><button className="text-blue-600" onClick={async () => { await fetch(`/api/people/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !p.isActive }) }); load(); }}>{p.isActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
