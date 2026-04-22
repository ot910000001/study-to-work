import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Bell,
  Search,
  FileText,
  LogOut,
  User,
  Building2,
  Plus,
  BarChart3,
  Users,
  Home,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isStudent = role === 'student';
  const isEmployer = role === 'employer';
  const isAdmin = role === 'admin';

  const navItems = [
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard', show: true },
    { href: '/jobs', icon: Search, label: 'Browse Jobs', show: isStudent },
    { href: '/applications', icon: Briefcase, label: 'My Applications', show: isStudent },
    { href: '/job-matching', icon: Brain, label: 'AI Job Matching', show: isStudent },
    { href: '/resume-center', icon: FileText, label: 'Resume Center', show: isStudent },
    { href: '/post-job', icon: Plus, label: 'Post a Job', show: isEmployer },
    { href: '/my-jobs', icon: Briefcase, label: 'My Job Posts', show: isEmployer },
    { href: '/employer-applications', icon: Users, label: 'Applications', show: isEmployer },
    { href: '/notifications', icon: Bell, label: 'Notifications', show: true },
    { href: '/profile', icon: User, label: 'Profile', show: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 border-b border-border bg-card p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">TechConnect</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed md:sticky top-0 left-0 z-40 w-64 border-r border-border bg-sidebar min-h-screen p-4 transition-transform md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Link to="/" className="hidden md:flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-sidebar-foreground">TechConnect</span>
          </Link>

          <div className="md:hidden mb-6 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <Badge variant="outline" className="text-xs capitalize text-sidebar-foreground border-sidebar-border">
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.filter(item => item.show).map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
                  location.pathname === item.href && "bg-sidebar-accent"
                )}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              asChild
            >
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Top Bar - Desktop only */}
          <header className="hidden md:flex border-b border-border bg-card p-4 items-center justify-between sticky top-0 z-20">
            <h1 className="text-xl font-semibold text-foreground">
              Welcome, {user?.user_metadata?.full_name || 'User'}!
            </h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="capitalize">
                {role} Account
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar className="cursor-pointer" onClick={() => navigate('/profile')}>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
