import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Menu,
  Building2,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Jurnal', href: '/journal', icon: BookOpen },
  { name: 'Akun', href: '/accounts', icon: Users },
  { name: 'Laporan', href: '/reports', icon: FileText },
  { name: 'Profil BUMDes', href: '/profile', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const SidebarContent = ({ isMobile = false }) => (
    <div className={cn(
      "flex h-full flex-col",
      isMobile ? "bg-blue-600" : "bg-blue-600"
    )}>
      <div className="flex h-16 items-center px-4 border-b border-blue-500">
        <Building2 className="h-6 w-6 text-white mr-2" />
        <div>
          <h1 className="text-lg font-semibold text-white">BUMDes</h1>
          <p className="text-xs text-blue-100">Sistem Akuntansi</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-blue-500">
        <p className="text-xs text-blue-200 text-center">
          © 2024 BUMDes Sistem Akuntansi
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white px-4 py-3 shadow-sm border-b">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">BUMDes</h1>
              <p className="text-xs text-gray-500">Sistem Akuntansi</p>
            </div>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent isMobile={true} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent />
      </div>
    </>
  );
}