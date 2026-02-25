import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Users,
  Briefcase,
  Clock,
  Mail,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

interface Application {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  student_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    skills: string[] | null;
    education: string | null;
  } | null;
  jobs: {
    id: string;
    title: string;
    company_name: string;
  };
}

interface Job {
  id: string;
  title: string;
}

const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'secondary' },
  { value: 'reviewing', label: 'Under Review', color: 'default' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'default' },
  { value: 'interview', label: 'Interview', color: 'default' },
  { value: 'hired', label: 'Hired', color: 'default' },
  { value: 'rejected', label: 'Rejected', color: 'destructive' },
];

export default function EmployerApplications() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>(searchParams.get('job') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchApplications();
    }
  }, [user, selectedJob, selectedStatus]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('employer_id', user?.id);
    
    if (data) {
      setJobs(data);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    
    // Get all jobs for this employer first
    const { data: employerJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('employer_id', user?.id);

    if (!employerJobs || employerJobs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const jobIds = employerJobs.map(j => j.id);
    
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        cover_letter,
        student_id,
        profiles!applications_student_id_fkey (
          full_name,
          email,
          skills,
          education
        ),
        jobs (
          id,
          title,
          company_name
        )
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (selectedJob !== 'all') {
      query = query.eq('job_id', selectedJob);
    }

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    const { data, error } = await query;

    if (!error && data) {
      setApplications(data as unknown as Application[]);
    }
    setLoading(false);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setApplications(applications.map(app =>
      app.id === applicationId ? { ...app, status: newStatus } : app
    ));

    toast({
      title: 'Status Updated',
      description: `Application status changed to ${newStatus}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return (
      <Badge variant={statusInfo?.color as 'default' | 'secondary' | 'destructive' | 'outline'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Applications</h1>
          <p className="text-muted-foreground">Review and manage candidate applications</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statusOptions.slice(0, 5).map((status) => (
            <Card key={status.value}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{status.label}</CardDescription>
                <CardTitle className="text-xl">
                  {applications.filter(a => a.status === status.value).length}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">
                {jobs.length === 0 
                  ? "Post your first job to start receiving applications."
                  : "No applications match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {application.profiles?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {application.profiles?.full_name || 'Unknown Applicant'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Briefcase className="h-4 w-4" />
                            Applied for: {application.jobs.title}
                          </CardDescription>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {application.profiles?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {application.profiles.email}
                      </span>
                    )}
                    {application.profiles?.education && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {application.profiles.education}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {application.profiles?.skills && application.profiles.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {application.profiles.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {application.cover_letter && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        "{application.cover_letter}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground mr-2">Update Status:</span>
                    <Select
                      value={application.status}
                      onValueChange={(value) => updateApplicationStatus(application.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
