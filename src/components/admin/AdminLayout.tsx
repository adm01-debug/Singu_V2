import { ReactNode } from 'react';
import { AdminSidebar, AdminMobileNav } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

/** Wraps admin pages with sidebar navigation */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row w-full">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <AdminMobileNav />
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
