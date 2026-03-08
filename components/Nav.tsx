'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/schedule', label: 'Schedule' },
  { href: '/project-plan', label: 'Project Plan' },
  { href: '/people', label: 'People' },
  { href: '/projects', label: 'Projects' }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h1 className="mb-6 text-xl font-bold">Resource Planner</h1>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('block rounded-md px-3 py-2 text-sm', pathname.startsWith(item.href) ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100')}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
