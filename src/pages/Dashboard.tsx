import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Briefcase,
  Bell,
  Search,
  FileText,
  LogOut,
  User,
  Building2,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <aside className="w-64 border-r border-border bg-card min-h-screen p-4">
            <Skeleton className="h-10 w-full mb-8" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </aside>
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isStudent = role === 'student';
  const isEmployer = role === 'employer';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar min-h-screen p-4 hidden md:block">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-sidebar-foreground">TechConnect</span>
          </Link>

          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            {isStudent && (
              <>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <Briefcase className="mr-2 h-4 w-4" />
                  My Applications
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <FileText className="mr-2 h-4 w-4" />
                  Resume Builder
                </Button>
              </>
            )}

            {isEmployer && (
              <>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <Plus className="mr-2 h-4 w-4" />
                  Post a Job
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <Briefcase className="mr-2 h-4 w-4" />
                  My Job Posts
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
                  <Users className="mr-2 h-4 w-4" />
                  Applications
                </Button>
              </>
            )}

            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
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

        {/* Main Content */}
        <main className="flex-1">
          {/* Top Bar */}
          <header className="border-b border-border bg-card p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              Welcome back, {user?.user_metadata?.full_name || 'User'}!
            </h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Role Badge */}
            <div className="mb-6">
              <Badge variant="outline" className="text-sm capitalize">
                {role} Account
              </Badge>
            </div>

            {/* Student Dashboard */}
            {isStudent && (
              <div className="space-y-6 animate-fade-in">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Applications Sent</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-success" />
                        Start applying today!
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Under Review</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending reviews
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Interviews</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        Scheduled
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Profile Views</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        This week
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Get started with your job search</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <Button className="h-auto py-6 flex flex-col gap-2">
                      <Search className="h-6 w-6" />
                      <span>Browse Jobs</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span>Build Resume</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                      <User className="h-6 w-6" />
                      <span>Complete Profile</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Applications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Track your application status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No applications yet</p>
                      <p className="text-sm">Start browsing jobs to find your dream opportunity!</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Employer Dashboard */}
            {isEmployer && (
              <div className="space-y-6 animate-fade-in">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Active Jobs</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Posted positions
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Applications</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Candidates applied
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Shortlisted</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        Ready for interview
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Hired</CardDescription>
                      <CardTitle className="text-3xl">0</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-success" />
                        This month
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your hiring pipeline</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <Button className="h-auto py-6 flex flex-col gap-2">
                      <Plus className="h-6 w-6" />
                      <span>Post New Job</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                      <Users className="h-6 w-6" />
                      <span>View Applications</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2">
                      <Building2 className="h-6 w-6" />
                      <span>Company Profile</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Posted Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Job Posts</CardTitle>
                    <CardDescription>Manage your active listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No jobs posted yet</p>
                      <p className="text-sm">Create your first job posting to start receiving applications!</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}