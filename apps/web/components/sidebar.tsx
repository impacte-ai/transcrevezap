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

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/connections', label: 'Conexões', icon: Cable },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/dashboard/groups', label: 'Grupos', icon: Users },
  { href: '/dashboard/blocks', label: 'Bloqueios', icon: ShieldBan },
];

const generalItems = [
  { href: '/dashboard/languages', label: 'Idiomas', icon: Languages },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
  { href: '/dashboard/users', label: 'Usuários', icon: UserCog },
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText },
];

function NavItem({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: typeof LayoutDashboard; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
      {label}
      {isActive && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Image src="/static/fluxo.png" alt="TranscreveZAP" width={28} height={28} className="rounded-lg" />
        </div>
        <div>
          <span className="font-display text-lg font-bold text-foreground">TranscreveZAP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {/* MENU Section */}
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Menu</p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>

        {/* GERAL Section */}
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Geral</p>
          <div className="space-y-1">
            {generalItems.map((item) => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => signOut().then(() => window.location.href = '/login')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </aside>
  );
}
