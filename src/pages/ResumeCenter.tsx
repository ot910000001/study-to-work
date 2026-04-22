import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Upload, Save, Loader2, Info } from 'lucide-react';
import { parseResume } from '@/lib/matching-api';

export default function ResumeCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<{ text: string; skills: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);
    setParsedData(null);

    try {
      const result = await parseResume(file);
      setParsedData(result);
      toast({
        title: 'Resume Parsed',
        description: `Successfully extracted ${result.skills.length} skills from your resume.`,
      });
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast({
        title: 'Parsing Failed',
        description: 'There was an error communicating with the AI service. Ensure the ML backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!user || !parsedData) return;

    setIsSaving(true);
    try {
      // First fetch current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills, bio')
        .eq('user_id', user.id)
        .single();
        
      // Merge new skills with existing skills without duplicates
      const currentSkills = profile?.skills || [];
      const newSkills = Array.from(new Set([...currentSkills, ...parsedData.skills]));

      const { error } = await supabase
        .from('profiles')
        .update({
          skills: newSkills,
          // Append extracted text to the bio if available
          bio: (profile?.bio || '') + (profile?.bio ? '\n\n---Resume Highlights---\n' : '') + parsedData.text.substring(0, 1000) 
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your skills and AI profile have been updated for better matching!',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not sync AI keywords with your profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Center</h1>
          <p className="text-muted-foreground mt-2">
            Upload your resume, and our AI engine will automatically extract the right keywords to optimize your profile for our job matching algorithm.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Resume Parsing</CardTitle>
            <CardDescription>Upload a PDF resume to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/20">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Click to upload</h3>
              <p className="text-sm text-muted-foreground mb-4">PDF format only (up to 5MB)</p>
              
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isParsing}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing Resume...
                  </>
                ) : (
                  <>Select PDF File</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {parsedData && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Extracted Skills
                </CardTitle>
                <CardDescription>
                  These keywords give you the best ML match scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.length > 0 ? (
                    parsedData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No standard technical skills detected. Ensure your resume has clear keywords.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveToProfile} 
                  disabled={isSaving || parsedData.skills.length === 0}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Keywords to Profile
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Extracted Plain Text
                </CardTitle>
                <CardDescription>
                  This text fuels the deep semantic SBERT algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-md overflow-y-auto max-h-[300px] text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {parsedData.text || "No text could be extracted."}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}