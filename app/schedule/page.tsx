'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useMemo, useState } from 'react';

type Person = { id: string; name: string; team?: string | null; weeklyCapacityHours: number };
type Project = { id: string; name: string; color: string; status: 'planned' | 'active' | 'done' };
type Assignment = {
  id: string;
  personId: string;
  projectId: string;
  startDateTime: string;
  endDateTime: string;
  allocationHoursPerDay: number;
  notes?: string | null;
  person: Person;
  project: Project;
};

export default function SchedulePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showTimeOff, setShowTimeOff] = useState(true);
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('all');
  const [status, setStatus] = useState('all');

  const load = async () => {
    const [peopleRes, projectsRes, assignmentsRes] = await Promise.all([
      fetch('/api/people'),
      fetch('/api/projects'),
      fetch('/api/assignments')
    ]);
    setPeople(await peopleRes.json());
    setProjects(await projectsRes.json());
    setAssignments(await assignmentsRes.json());
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 12000);
    return () => clearInterval(i);
  }, []);

  const filteredPeople = useMemo(
    () => people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && (team === 'all' || p.team === team)),
    [people, search, team]
  );

  const allowedPeopleIds = new Set(filteredPeople.map((p) => p.id));
  const filteredAssignments = assignments.filter(
    (a) => allowedPeopleIds.has(a.personId) && (status === 'all' || a.project.status === status)
  );

  const events = filteredAssignments.map((a) => ({
    id: a.id,
    title: `${a.person.name} · ${a.project.name} (${a.allocationHoursPerDay}h/day)`,
    start: a.startDateTime,
    end: a.endDateTime,
    backgroundColor: a.project.color,
    borderColor: a.project.color
  }));

  const createAssignment = async (startStr: string, endStr: string) => {
    const personId = prompt('Person ID');
    const projectId = prompt('Project ID');
    if (!personId || !projectId) return;

    await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId,
        projectId,
        startDateTime: new Date(startStr).toISOString(),
        endDateTime: new Date(endStr).toISOString(),
        allocationHoursPerDay: 8
      })
    });

    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Schedule</h2>
      <div className="grid grid-cols-[280px_1fr] gap-4">
        <section className="space-y-3 rounded-lg border bg-white p-4">
          <input className="w-full rounded border p-2" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="w-full rounded border p-2" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="all">All teams</option>
            {[...new Set(people.map((p) => p.team).filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="w-full rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All project status</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showTimeOff} onChange={(e) => setShowTimeOff(e.target.checked)} />
            Show time off
          </label>
          <div className="text-xs text-slate-500">Create/edit quickly by dragging blocks. Double-click an event to delete.</div>
          <div className="rounded bg-slate-50 p-2 text-xs">
            IDs for quick-create:<br />
            People: {people.map((p) => `${p.name}:${p.id.slice(0, 6)}`).join(', ')}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-3">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            editable
            selectable
            nowIndicator
            events={events}
            select={async (s) => createAssignment(s.startStr, s.endStr)}
            eventDrop={async (info) => {
              await fetch(`/api/assignments/${info.event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDateTime: info.event.start?.toISOString(), endDateTime: info.event.end?.toISOString() })
              });
              await load();
            }}
            eventResize={async (info) => {
              await fetch(`/api/assignments/${info.event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDateTime: info.event.start?.toISOString(), endDateTime: info.event.end?.toISOString() })
              });
              await load();
            }}
            eventClick={async (info) => {
              if (confirm('Duplicate assignment?')) {
                const source = assignments.find((a) => a.id === info.event.id);
                if (source) {
                  await fetch('/api/assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      personId: source.personId,
                      projectId: source.projectId,
                      startDateTime: source.startDateTime,
                      endDateTime: source.endDateTime,
                      allocationHoursPerDay: source.allocationHoursPerDay,
                      notes: source.notes
                    })
                  });
                }
              }
              if (confirm('Delete assignment?')) {
                await fetch(`/api/assignments/${info.event.id}`, { method: 'DELETE' });
              }
              await load();
            }}
          />
        </section>
      </div>
    </div>
  );
}
