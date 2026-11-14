import { NavLink } from 'react-router-dom';
import { ADMIN_SIDEBAR_ITEMS, USER_SIDEBAR_ITEMS } from '../../constants/navigation';
import useTenantPath from '../../hooks/useTenantPath';
import ChangeRefugioLink from './ChangeRefugioLink';

export default function Sidebar({ admin = false }) {
  const items = admin ? ADMIN_SIDEBAR_ITEMS : USER_SIDEBAR_ITEMS;
  const tenantPath = useTenantPath();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="bg-warm-white dark:bg-brown-soft rounded-2xl shadow-soft border border-cream-200/60 dark:border-cream-200/10 p-4 sticky top-24 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.segment}
            to={tenantPath(item.segment)}
            end={item.end}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-terracotta text-white shadow-soft'
                  : 'text-brown-dark dark:text-cream-50 hover:bg-cream-100 hover:text-terracotta dark:hover:bg-white/15 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <div className="pt-3 mt-3 border-t border-cream-200/80 dark:border-cream-200/10">
          <ChangeRefugioLink
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brown-soft hover:bg-cream-100 hover:text-terracotta dark:hover:bg-white/15 dark:hover:text-white transition-colors"
          />
        </div>
      </nav>
    </aside>
  );
}
