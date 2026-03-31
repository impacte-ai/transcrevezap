'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Cable,
  Webhook,
  Users,
  ShieldBan,
  Languages,
  Settings,
  UserCog,
  ScrollText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/connections', label: 'Conexões', icon: Cable },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/dashboard/groups', label: 'Grupos', icon: Users },
  { href: '/dashboard/blocks', label: 'Bloqueios', icon: ShieldBan },
  { href: '/dashboard/languages', label: 'Idiomas', icon: Languages },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
  { href: '/dashboard/users', label: 'Usuários', icon: UserCog },
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <Image src="/static/fluxo.png" alt="TranscreveZAP" width={36} height={36} className="rounded" />
        <span className="text-lg font-semibold text-foreground">TranscreveZAP</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => signOut().then(() => window.location.href = '/login')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
