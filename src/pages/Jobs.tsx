import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchRemoteJobs, RemoteJob } from '@/lib/remote-jobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  DollarSign,
  Filter,
  X,
  ArrowRight,
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
}

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' }
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' }
];

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [jobTypeFilter, setJobTypeFilter] = useState(searchParams.get('type') || '');
  const [experienceFilter, setExperienceFilter] = useState(searchParams.get('experience') || '');
  const [remoteJobs, setRemoteJobs] = useState<RemoteJob[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchExternalJobs();
  }, [searchParams]);

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const experience = searchParams.get('experience');

    if (search) {
      query = query.or(`title.ilike.%${search}%,company_name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    if (type) {
      query = query.eq('job_type', type);
    }
    if (experience) {
      query = query.eq('experience_level', experience);
    }

    const { data, error } = await query;

    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const fetchExternalJobs = async () => {
    setRemoteError(null);
    setRemoteLoading(true);
    try {
      const external = await fetchRemoteJobs(searchParams.get('search') || undefined);
      setRemoteJobs(external.slice(0, 10));
    } catch (err) {
      setRemoteError(err instanceof Error ? err.message : 'Unable to load remote jobs');
    } finally {
      setRemoteLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (locationFilter) params.set('location', locationFilter);
    if (jobTypeFilter) params.set('type', jobTypeFilter);
    if (experienceFilter) params.set('experience', experienceFilter);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setJobTypeFilter('');
    setExperienceFilter('');
    setSearchParams({});
  };

  const hasFilters = searchTerm || locationFilter || jobTypeFilter || experienceFilter;

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Browse Jobs</h1>
          <p className="text-muted-foreground">Find your next opportunity from top companies</p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="relative flex-1 md:max-w-[200px]">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="md:w-[150px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="md:w-[150px]">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">
                  <Filter className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {hasFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchTerm && (
                    <Badge variant="secondary">"{searchTerm}"</Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="secondary">{locationFilter}</Badge>
                  )}
                  {jobTypeFilter && (
                    <Badge variant="secondary">{jobTypes.find(t => t.value === jobTypeFilter)?.label || jobTypeFilter}</Badge>
                  )}
                  {experienceFilter && (
                    <Badge variant="secondary">{experienceLevels.find(e => e.value === experienceFilter)?.label || experienceFilter}</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${jobs.length} jobs found`}
          </p>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search filters or check back later for new opportunities.
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {job.company_name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={job.job_type === 'internship' ? 'secondary' : 'default'}>
                        {job.job_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {job.experience_level && (
                        <Badge variant="outline">
                          {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    {formatSalary(job.salary_min, job.salary_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                    </span>
                    {job.application_deadline && (
                      <span className="flex items-center gap-1 text-warning">
                        <Clock className="h-4 w-4" />
                        Deadline: {format(new Date(job.application_deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills_required.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills_required.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.skills_required.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {job.description}
                  </p>

                  <Button asChild>
                    <Link to={`/jobs/${job.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Remote Jobs (External API) */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Remote Opportunities</h2>
            <p className="text-muted-foreground">Live listings from external sources (no account needed)</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchExternalJobs} disabled={remoteLoading}>
            {remoteLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {remoteLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={`remote-skel-${i}`}>
                <CardHeader>
                  <Skeleton className="h-5 w-60 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : remoteError ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-destructive">{remoteError}</p>
              <Button variant="outline" className="mt-3" onClick={fetchExternalJobs}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : remoteJobs.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground">No external remote jobs matched your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {remoteJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {job.company_name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{job.job_type || 'External'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy') : 'Recently posted'}
                    </span>
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.tags.slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                  <Button asChild variant="outline">
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      View & Apply
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
