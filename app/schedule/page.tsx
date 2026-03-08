'use client';

import { addDays, endOfWeek, format, isBefore, isSameDay, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

type Person = {
  id: string;
  name: string;
  role: string;
  team?: string | null;
  weeklyCapacityHours: number;
  isActive: boolean;
};

type Project = {
  id: string;
  name: string;
  color: string;
  status: 'planned' | 'active' | 'done';
};

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

const DAY_CAPACITY_HOURS = 8;

export default function SchedulePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('all');
  const [status, setStatus] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const [showTimeOff, setShowTimeOff] = useState(true);
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('all');
  const [status, setStatus] = useState('all');

  const load = async () => {
    const [peopleRes, projectsRes, assignmentsRes] = await Promise.all([
      fetch('/api/people'),
      fetch('/api/projects'),
      fetch(`/api/assignments?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`)
    ]);

      fetch('/api/assignments')
    ]);
    setPeople(await peopleRes.json());
    setProjects(await projectsRes.json());
    setAssignments(await assignmentsRes.json());
  };

  useEffect(() => {
    void load();
  }, [weekStart]);

  const teamOptions = useMemo(
    () => [...new Set(people.map((p) => p.team).filter((t): t is string => Boolean(t)))],
    [people]
  );

  const filteredPeople = useMemo(
    () =>
      people.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) &&
          (team === 'all' || p.team === team) &&
          (showInactive || p.isActive)
      ),
    [people, search, team, showInactive]
  );

  const allowedPeopleIds = useMemo(() => new Set(filteredPeople.map((p) => p.id)), [filteredPeople]);

  const filteredAssignments = useMemo(
    () => assignments.filter((a) => allowedPeopleIds.has(a.personId) && (status === 'all' || a.project.status === status)),
    [assignments, allowedPeopleIds, status]
  );

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment[]>();

    for (const assignment of filteredAssignments) {
      const key = assignment.personId;
      const existing = map.get(key) ?? [];
      existing.push(assignment);
      map.set(key, existing);
    }

    return map;
  }, [filteredAssignments]);

  const getAssignmentsForPersonDay = (personId: string, day: Date) => {
    const rows = assignmentMap.get(personId) ?? [];

    return rows.filter((row) => {
      const start = new Date(row.startDateTime);
      const end = new Date(row.endDateTime);
      return (isSameDay(start, day) || isBefore(start, day)) && isBefore(day, end);
    });
  };

  const getDayTotal = (personId: string, day: Date) =>
    getAssignmentsForPersonDay(personId, day).reduce((sum, item) => sum + item.allocationHoursPerDay, 0);

  const quickCreateAssignment = async (personId: string, day: Date) => {
    const projectId = prompt(`Project ID\n${projects.map((p) => `${p.name}: ${p.id}`).join('\n')}`);
    if (!projectId) return;

    const hoursInput = prompt('Allocation hours/day', '8');
    const allocationHoursPerDay = Number(hoursInput ?? 8);

    if (!allocationHoursPerDay || allocationHoursPerDay <= 0) {
      alert('Invalid allocation hours.');
      return;
    }

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(day);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
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
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        allocationHoursPerDay
      })
    });

    await load();
  };

  const shiftAssignment = async (assignment: Assignment, dayOffset: number) => {
    const start = new Date(assignment.startDateTime);
    const end = new Date(assignment.endDateTime);

    start.setDate(start.getDate() + dayOffset);
    end.setDate(end.getDate() + dayOffset);

    await fetch(`/api/assignments/${assignment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString()
        startDateTime: new Date(startStr).toISOString(),
        endDateTime: new Date(endStr).toISOString(),
        allocationHoursPerDay: 8
      })
    });

    await load();
  };

  const weekTotal = filteredAssignments.reduce((sum, assignment) => sum + assignment.allocationHoursPerDay, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Schedule</h2>
        <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">{weekTotal.toFixed(1)}h planned / day</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
        <button className="rounded border px-3 py-1 text-sm" onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}>← Prev</button>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</button>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}>Next →</button>
        <div className="ml-2 text-sm font-medium text-slate-700">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</div>

        <input className="ml-auto rounded border px-3 py-1 text-sm" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded border px-2 py-1 text-sm" value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="all">All teams</option>
          {teamOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select className="rounded border px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All project status</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-[240px_repeat(7,minmax(120px,1fr))] border-b bg-slate-50">
          <div className="border-r px-4 py-3 text-sm font-medium text-slate-700">Staff</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="border-r px-2 py-2 text-center last:border-r-0">
              <div className="text-xs uppercase text-slate-500">{format(day, 'EEE')}</div>
              <div className="text-sm font-semibold text-slate-800">{format(day, 'd MMM')}</div>
            </div>
          ))}
        </div>

        {filteredPeople.map((person) => (
          <div key={person.id} className="grid grid-cols-[240px_repeat(7,minmax(120px,1fr))] border-b last:border-b-0">
            <div className="border-r px-4 py-3">
              <div className="font-medium text-slate-900">{person.name}</div>
              <div className="text-xs text-slate-500">{person.role} · {person.team ?? 'No team'}</div>
            </div>

            {weekDays.map((day) => {
              const items = getAssignmentsForPersonDay(person.id, day);
              const total = getDayTotal(person.id, day);
              const isOver = total > DAY_CAPACITY_HOURS;

              return (
                <div
                  key={`${person.id}-${day.toISOString()}`}
                  className={`relative min-h-[112px] border-r p-1 align-top last:border-r-0 ${isOver ? 'bg-red-500/10' : 'bg-white'}`}
                  onDoubleClick={() => void quickCreateAssignment(person.id, day)}
                >
                  <div className="space-y-1">
                    {items.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: assignment.project.color }}
                        title={`${assignment.project.name} (${assignment.allocationHoursPerDay}h/day)`}
                      >
                        <div className="truncate">{assignment.project.name}</div>
                        <div className="flex items-center justify-between">
                          <span>{assignment.allocationHoursPerDay}h</span>
                          <span className="flex gap-1">
                            <button
                              className="rounded bg-black/20 px-1"
                              onClick={(event) => {
                                event.stopPropagation();
                                void shiftAssignment(assignment, -1);
                              }}
                            >
                              ←
                            </button>
                            <button
                              className="rounded bg-black/20 px-1"
                              onClick={(event) => {
                                event.stopPropagation();
                                void shiftAssignment(assignment, 1);
                              }}
                            >
                              →
                            </button>
                            <button
                              className="rounded bg-black/20 px-1"
                              onClick={async (event) => {
                                event.stopPropagation();
                                await fetch(`/api/assignments/${assignment.id}`, { method: 'DELETE' });
                                await load();
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`absolute bottom-1 right-1 rounded px-1 text-[10px] ${isOver ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {total.toFixed(1)}h
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500">Tip: Double-click any day cell to add an allocation for that person. Use ←/→ on a block to move it by one day.</div>
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
