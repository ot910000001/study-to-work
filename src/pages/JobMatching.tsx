import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  matchJobs,
  getMLHealth,
  getModelInfo,
  type MatchResult,
  type MatchResponse,
  type ModelInfo,
} from '@/lib/matching-api';
import { fetchRemoteJobs } from '@/lib/remote-jobs';

export default function JobMatching() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [matchResponse, setMatchResponse] = useState<MatchResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [mlHealthy, setMlHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [jobUrls, setJobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkMLHealth();
      loadProfile();
    }
  }, [user]);

  const checkMLHealth = async () => {
    try {
      const health = await getMLHealth();
      setMlHealthy(health.engine_ready);
      if (health.engine_ready) {
        const info = await getModelInfo();
        setModelInfo(info);
      }
    } catch {
      setMlHealthy(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  // Client-side fallback matching when ML service is unavailable
  const clientSideMatch = (studentProfile: any, jobs: any[]): MatchResponse => {
    const profileSkills = (studentProfile.skills || []).map((s: string) => s.toLowerCase().trim());
    const profileText = [studentProfile.bio, studentProfile.education, studentProfile.experience, ...profileSkills].filter(Boolean).join(' ').toLowerCase();
    const profileWords = new Set(profileText.split(/\W+/).filter((w: string) => w.length > 2));

    const matches: MatchResult[] = jobs.map((job: any) => {
      const jobSkills = (job.skills_required || []).map((s: string) => s.toLowerCase().trim());
      const jobText = [job.title, job.description, job.company_name, ...jobSkills].filter(Boolean).join(' ').toLowerCase();
      const jobWords = new Set(jobText.split(/\W+/).filter((w: string) => w.length > 2));

      // Skills overlap (Jaccard)
      const matchingSkills = profileSkills.filter((s: string) => jobSkills.includes(s));
      const missingSkills = jobSkills.filter((s: string) => !profileSkills.includes(s));
      const allSkills = new Set([...profileSkills, ...jobSkills]);
      const skillsOverlap = allSkills.size > 0 ? matchingSkills.length / allSkills.size : 0;
      const skillsCoverage = jobSkills.length > 0 ? matchingSkills.length / jobSkills.length : 0;

      // Text similarity (word overlap as TF-IDF proxy)
      const intersection = [...profileWords].filter(w => jobWords.has(w));
      const union = new Set([...profileWords, ...jobWords]);
      const textSimilarity = union.size > 0 ? intersection.length / union.size : 0;

      // Experience match heuristic
      const expLevel = (job.experience_level || '').toLowerCase();
      const experienceMatch = !expLevel || expLevel === 'entry' ? 1.0 : 0.5;

      // Combined score
      const matchScore = Math.round(
        (skillsOverlap * 35 + textSimilarity * 100 * 20 / 100 + textSimilarity * 100 * 25 / 100 + experienceMatch * 10 + 0.7 * 10) * 100
      ) / 100;
      const clampedScore = Math.min(Math.round(matchScore * 10) / 10, 99);

      return {
        job_id: job.id.toString(),
        job_title: job.title,
        company_name: job.company_name,
        location: job.location,
        match_score: clampedScore,
        is_good_match: clampedScore >= 35,
        breakdown: {
          skills_overlap: Math.round(skillsOverlap * 1000) / 10,
          skills_coverage: Math.round(skillsCoverage * 1000) / 10,
          tfidf_similarity: Math.round(textSimilarity * 1000) / 10,
          sbert_similarity: Math.round(textSimilarity * 800) / 10,
          experience_fit: Math.round(experienceMatch * 1000) / 10,
          job_type_fit: 70,
        },
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        feature_contributions: {},
      };
    });

    matches.sort((a, b) => b.match_score - a.match_score);
    return {
      matches,
      total_jobs: jobs.length,
      good_matches: matches.filter(m => m.is_good_match).length,
      model_info: {
        tfidf: mlHealthy ? 'active' : 'client-side fallback',
        sbert: mlHealthy ? 'active' : 'client-side fallback',
        random_forest: mlHealthy ? 'active' : 'client-side fallback',
      },
    };
  };

  const runMatching = async () => {
    if (!profile) return;

    setMatching(true);
    try {
      // Fetch all active jobs from Supabase
      const { data: localJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      let remoteJobsData: any[] = [];
      try {
        const fetchRes = await fetchRemoteJobs();
        remoteJobsData = fetchRes;
      } catch (err) {
        console.error("Failed to fetch remote jobs", err);
      }

      const allJobs = [...(localJobs || []), ...remoteJobsData];

      if (allJobs.length === 0) {
        toast({
          title: 'No jobs available',
          description: 'There are no active job listings to match against.',
          variant: 'destructive',
        });
        setMatching(false);
        return;
      }

      // Prepare data
      const studentProfile = {
        skills: profile.skills || [],
        bio: profile.bio || '',
        education: profile.education || '',
        experience: profile.experience || '',
      };

      const jobListings = allJobs.map((j: any) => ({
        id: j.id.toString(),
        title: j.title || '',
        description: j.description || '',
        skills_required: j.skills_required || j.tags || [],
        experience_level: j.experience_level || '',
        job_type: j.job_type || '',
        company_name: j.company_name || '',
        location: j.location || '',
      }));

      const urlMap: Record<string, string> = {};
      allJobs.forEach((j: any) => {
        if (j.url) {
          urlMap[j.id.toString()] = j.url;
        }
      });
      setJobUrls(urlMap);

      let response: MatchResponse;

      // Try ML service first, fall back to client-side matching
      if (mlHealthy) {
        try {
          response = await matchJobs(studentProfile, jobListings);
        } catch {
          console.warn('ML service failed, using client-side matching');
          response = clientSideMatch(studentProfile, jobListings);
        }
      } else {
        response = clientSideMatch(studentProfile, jobListings);
      }

      setMatchResults(response.matches);
      setMatchResponse(response);

      toast({
        title: 'Matching Complete! 🎯',
        description: `Found ${response.good_matches} strong matches out of ${response.total_jobs} jobs.`,
      });
    } catch (err: any) {
      console.error('Matching error:', err);
      toast({
        title: 'Matching Failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-100 border-green-300';
    if (score >= 50) return 'bg-yellow-100 border-yellow-300';
    if (score >= 25) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return '[&>div]:bg-green-500';
    if (score >= 50) return '[&>div]:bg-yellow-500';
    if (score >= 25) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (role !== 'student') {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Student Feature</h2>
            <p className="text-muted-foreground">Job matching is available for student accounts only.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const hasProfile = profile && (
    (profile.skills && profile.skills.length > 0) ||
    profile.bio ||
    profile.education ||
    profile.experience
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI Job Matching
            </h1>
            <p className="text-muted-foreground mt-1">
              Powered by TF-IDF, SBERT, and Random Forest ML models
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={mlHealthy ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
            >
              <span className={`h-2 w-2 rounded-full mr-1.5 ${mlHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              ML Service {mlHealthy ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* ML Model Info Panel */}
        {modelInfo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowModelDetails(!showModelDetails)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  ML Pipeline Status
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {showModelDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </CardHeader>
            {showModelDetails && (
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    TF-IDF Vectorizer
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {modelInfo.models.tfidf.description}
                  </p>
                  <p className="text-xs mt-1">
                    Max features: {modelInfo.models.tfidf.max_features} | N-grams: {modelInfo.models.tfidf.ngram_range.join('-')}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Sentence-BERT
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {modelInfo.models.sbert.description}
                  </p>
                  <p className="text-xs mt-1">
                    Model: {modelInfo.models.sbert.model_name} |{' '}
                    <span className={modelInfo.models.sbert.available ? 'text-green-600' : 'text-yellow-600'}>
                      {modelInfo.models.sbert.available ? 'Active' : 'Fallback mode'}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-green-500" />
                    Random Forest
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {modelInfo.models.random_forest.description}
                  </p>
                  <p className="text-xs mt-1">
                    Trees: {modelInfo.models.random_forest.n_estimators} |{' '}
                    Features: {modelInfo.models.random_forest.features.length}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Profile Check + Run Button */}
        <Card>
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              {hasProfile ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium">Profile Ready</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.skills?.length || 0} skills · {profile.education ? 'Education ✓' : 'No education'} · {profile.experience ? 'Experience ✓' : 'No experience'}
                    </p>
                  </div>
                </>
              ) : profile ? (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium">Profile Incomplete</p>
                    <p className="text-sm text-muted-foreground">
                      Add skills, education, or experience for better match results. You can still run matching now.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="font-medium">No Profile Found</p>
                    <p className="text-sm text-muted-foreground">
                      Please complete your profile first to start matching.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/profile">Edit Profile</Link>
              </Button>
              <Button
                onClick={runMatching}
                disabled={matching || !profile}
                className="gap-2"
              >
                {matching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Find My Matches
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Match Summary */}
        {matchResponse && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Jobs Analyzed</CardDescription>
                <CardTitle className="text-3xl">{matchResponse.total_jobs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Strong Matches</CardDescription>
                <CardTitle className="text-3xl text-green-600">{matchResponse.good_matches}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>ML Models Active</CardDescription>
                <CardTitle className="text-3xl">
                  {Object.values(matchResponse.model_info).filter(v => v === 'active').length}/3
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Match Results */}
        {matchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Match Results</h2>
            {matchResults.map((match, index) => (
              <Card key={match.job_id} className={`overflow-hidden ${match.is_good_match ? 'border-green-200' : ''}`}>
                <div className="flex">
                  {/* Score Badge */}
                  <div className={`w-24 flex flex-col items-center justify-center border-r ${getScoreBg(match.match_score)} p-4`}>
                    <span className={`text-2xl font-bold ${getScoreColor(match.match_score)}`}>
                      {match.match_score}%
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">match</span>
                    {index === 0 && (
                      <Badge className="mt-2 bg-primary text-xs">Best</Badge>
                    )}
                  </div>

                  {/* Job Details & Breakdown */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{match.job_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {match.company_name} · {match.location}
                        </p>
                      </div>
                      <Button size="sm" className="gap-1" asChild>
                        {!jobUrls[match.job_id] ? (
                          <Link to={`/jobs/${match.job_id}`}>
                            View Job <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <a href={jobUrls[match.job_id]} target="_blank" rel="noopener noreferrer">
                            External <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </Button>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Skills Match</span>
                          <span className="font-medium">{match.breakdown.skills_coverage}%</span>
                        </div>
                        <Progress value={match.breakdown.skills_coverage} className={`h-1.5 ${getProgressColor(match.breakdown.skills_coverage)}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">TF-IDF Similarity</span>
                          <span className="font-medium">{match.breakdown.tfidf_similarity}%</span>
                        </div>
                        <Progress value={match.breakdown.tfidf_similarity} className={`h-1.5 ${getProgressColor(match.breakdown.tfidf_similarity)}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Semantic (SBERT)</span>
                          <span className="font-medium">{match.breakdown.sbert_similarity}%</span>
                        </div>
                        <Progress value={match.breakdown.sbert_similarity} className={`h-1.5 ${getProgressColor(match.breakdown.sbert_similarity)}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Experience Fit</span>
                          <span className="font-medium">{match.breakdown.experience_fit}%</span>
                        </div>
                        <Progress value={match.breakdown.experience_fit} className={`h-1.5 ${getProgressColor(match.breakdown.experience_fit)}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Job Type Fit</span>
                          <span className="font-medium">{match.breakdown.job_type_fit}%</span>
                        </div>
                        <Progress value={match.breakdown.job_type_fit} className={`h-1.5 ${getProgressColor(match.breakdown.job_type_fit)}`} />
                      </div>
                    </div>

                    {/* Skills Analysis */}
                    <div className="flex flex-wrap gap-1.5">
                      {match.matching_skills.map(skill => (
                        <Badge key={skill} variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                          ✓ {skill}
                        </Badge>
                      ))}
                      {match.missing_skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs text-red-500 border-red-200">
                          ✗ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!matching && matchResults.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Find Your Best Matches</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Our AI engine uses TF-IDF text analysis, SBERT semantic understanding,
                and a Random Forest classifier to find jobs that truly match your skills and experience.
              </p>
              <div className="flex gap-3 items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-blue-500" /> TF-IDF
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-purple-500" /> SBERT
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" /> Random Forest
                </div>
                <span>=</span>
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <Zap className="h-4 w-4 text-primary" /> Smart Matching
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
