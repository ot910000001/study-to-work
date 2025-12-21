import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Briefcase,
  Search,
  FileText,
  User,
  Plus,
  Users,
  Building2,
  Clock,
  CheckCircle,
  Eye,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    );
  }

  const isStudent = role === 'student';
  const isEmployer = role === 'employer';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Student Dashboard */}
        {isStudent && (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with your job search</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <Button className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/jobs">
                    <Search className="h-6 w-6" />
                    <span>Browse Jobs</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/applications">
                    <Briefcase className="h-6 w-6" />
                    <span>My Applications</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/profile">
                    <User className="h-6 w-6" />
                    <span>Complete Profile</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Employer Dashboard */}
        {isEmployer && (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your hiring pipeline</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <Button className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/post-job">
                    <Plus className="h-6 w-6" />
                    <span>Post New Job</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/employer-applications">
                    <Users className="h-6 w-6" />
                    <span>View Applications</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
                  <Link to="/profile">
                    <Building2 className="h-6 w-6" />
                    <span>Company Profile</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
