import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  DollarSign,
  ArrowLeft,
  Send,
  CheckCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  skills_required: string[] | null;
  description: string;
  application_deadline: string | null;
  created_at: string;
  employer_id: string;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
      if (user) {
        checkExistingApplication();
      }
    }
  }, [id, user]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setJob(data);
    }
    setLoading(false);
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', id)
      .eq('student_id', user.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleApply = async () => {
    if (!user || !job) return;

    setIsApplying(true);

    const { error } = await supabase.from('applications').insert({
      job_id: job.id,
      student_id: user.id,
      cover_letter: coverLetter || null,
      status: 'applied',
    });

    setIsApplying(false);
    setDialogOpen(false);

    if (error) {
      toast({
        title: 'Application Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setHasApplied(true);
    toast({
      title: 'Application Submitted!',
      description: 'Your application has been sent to the employer.',
    });
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k per year`;
    if (min) return `$${(min / 1000).toFixed(0)}k+ per year`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k per year`;
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-96 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">This job listing may have been removed or is no longer active.</p>
          <Button onClick={() => navigate('/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isStudent = role === 'student';
  const deadlinePassed = job.application_deadline && new Date(job.application_deadline) < new Date();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={job.job_type === 'internship' ? 'secondary' : 'default'}>
                    {job.job_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {job.experience_level && (
                    <Badge variant="outline">
                      {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl md:text-3xl">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base mt-2">
                  <Building2 className="h-5 w-5" />
                  {job.company_name}
                </CardDescription>
              </div>

              {isStudent && (
                <div className="flex-shrink-0">
                  {hasApplied ? (
                    <Button disabled className="w-full md:w-auto">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Applied
                    </Button>
                  ) : deadlinePassed ? (
                    <Button disabled className="w-full md:w-auto">
                      Deadline Passed
                    </Button>
                  ) : (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="w-full md:w-auto">
                          <Send className="mr-2 h-4 w-4" />
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply for {job.title}</DialogTitle>
                          <DialogDescription>
                            at {job.company_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                            <Textarea
                              id="cover-letter"
                              placeholder="Tell the employer why you're a great fit for this role..."
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={6}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApply} disabled={isApplying}>
                            {isApplying ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Application
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{job.location}</span>
              </div>
              {formatSalary(job.salary_min, job.salary_max) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>Posted {format(new Date(job.created_at), 'MMMM d, yyyy')}</span>
              </div>
              {job.application_deadline && (
                <div className={`flex items-center gap-2 ${deadlinePassed ? 'text-destructive' : 'text-warning'}`}>
                  <Calendar className="h-5 w-5" />
                  <span>
                    {deadlinePassed ? 'Deadline passed' : `Apply by ${format(new Date(job.application_deadline), 'MMMM d, yyyy')}`}
                  </span>
                </div>
              )}
            </div>

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {job.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
