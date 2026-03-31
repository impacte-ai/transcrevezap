'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
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
  UserCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface MenuItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: { entity: string; action: string };
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: { entity: 'statistics', action: 'read' } },
  { href: '/dashboard/connections', label: 'Conexões', icon: Cable, permission: { entity: 'connections', action: 'read' } },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook, permission: { entity: 'webhooks', action: 'read' } },
  { href: '/dashboard/groups', label: 'Grupos', icon: Users, permission: { entity: 'groups', action: 'read' } },
  { href: '/dashboard/blocks', label: 'Bloqueios', icon: ShieldBan, permission: { entity: 'blocks', action: 'read' } },
];

const generalItems: MenuItem[] = [
  { href: '/dashboard/languages', label: 'Idiomas', icon: Languages, permission: { entity: 'languages', action: 'read' } },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings, permission: { entity: 'settings', action: 'read' } },
  { href: '/dashboard/users', label: 'Usuários', icon: UserCog, permission: { entity: 'users', action: 'read' } },
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText, permission: { entity: 'logs', action: 'read' } },
];

interface UserInfo {
  name: string;
  email: string;
  role: string;
  permissions: Record<string, string[]>;
}

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

function hasPermission(userInfo: UserInfo | null, permission?: { entity: string; action: string }): boolean {
  if (!userInfo) return false;
  if (!permission) return true;
  const actions = userInfo.permissions[permission.entity];
  if (!actions) return false;
  return actions.includes(permission.action);
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && !data.error) {
          setUserInfo(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const filteredMenuItems = menuItems.filter((item) => hasPermission(userInfo, item.permission));
  const filteredGeneralItems = generalItems.filter((item) => hasPermission(userInfo, item.permission));

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-white/90 shadow-sm">
          <Image src="/static/fluxo.png" alt="TranscreveZAP" width={32} height={32} className="rounded-lg" />
        </div>
        <div>
          <span className="font-display text-lg font-bold text-foreground">TranscreveZAP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {/* MENU Section */}
        {!loading && filteredMenuItems.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Menu</p>
            <div className="space-y-1">
              {filteredMenuItems.map((item) => (
                <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
              ))}
            </div>
          </div>
        )}

        {/* GERAL Section */}
        {!loading && filteredGeneralItems.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Geral</p>
            <div className="space-y-1">
              {filteredGeneralItems.map((item) => (
                <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1">
        {userInfo && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{userInfo.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userInfo.role}</p>
          </div>
        )}
        <NavItem
          href="/dashboard/profile"
          label="Meu Perfil"
          icon={UserCircle}
          isActive={isActive('/dashboard/profile')}
        />
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )}
          {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        </button>
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
