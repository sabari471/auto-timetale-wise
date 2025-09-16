import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  course_assignment: {
    course: {
      name: string;
      code: string;
      course_type: string;
    };
    faculty: {
      profile: {
        full_name: string;
      };
    };
  };
  room: {
    name: string;
    code: string;
  };
  batch: {
    name: string;
  };
}

interface TimetableRun {
  id: string;
  name: string;
  status: string;
  academic_year: string;
  semester: number;
  created_at: string;
}

export const useTimetable = () => {
  const { profile } = useAuth();
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [runs, setRuns] = useState<TimetableRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRun, setActiveRun] = useState<string | null>(null);

  // Fetch timetable runs
  const fetchRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('timetable_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRuns(data || []);
      
      // Set active run to the latest published one
      const published = data?.find(run => run.status === 'published');
      if (published) {
        setActiveRun(published.id);
      } else if (data?.length > 0) {
        setActiveRun(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching runs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable runs",
        variant: "destructive",
      });
    }
  };

  // Fetch timetable data for active run
  const fetchTimetables = async (runId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('timetables')
        .select(`
          *,
          course_assignment:course_assignments!inner(
            course:courses(*),
            faculty:faculty!inner(
              profile:profiles(*)
            )
          ),
          room:rooms(*),
          batch:batches(*)
        `)
        .eq('run_id', runId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setTimetables(data || []);
    } catch (error: any) {
      console.error('Error fetching timetables:', error);
      toast({
        title: "Error",
        description: "Failed to fetch timetable data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate new timetable
  const generateTimetable = async (config: any) => {
    try {
      setLoading(true);
      
      const response = await supabase.functions.invoke('generate-timetable', {
        body: {
          academic_year: '2024-25',
          semester: 1,
          config
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Timetable generated successfully!",
        variant: "default",
      });

      // Refresh runs and set new active run
      await fetchRuns();
      if (response.data?.run_id) {
        setActiveRun(response.data.run_id);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error generating timetable:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate timetable",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Publish timetable run
  const publishTimetable = async (runId: string) => {
    try {
      const { error } = await supabase
        .from('timetable_runs')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', runId);

      if (error) throw error;

      toast({
        title: "Published",
        description: "Timetable has been published successfully!",
        variant: "default",
      });

      await fetchRuns();
    } catch (error: any) {
      console.error('Error publishing timetable:', error);
      toast({
        title: "Error",
        description: "Failed to publish timetable",
        variant: "destructive",
      });
    }
  };

  // Get filtered timetables based on user role
  const getFilteredTimetables = () => {
    if (!profile) return timetables;

    switch (profile.role) {
      case 'faculty':
        return timetables.filter(entry => 
          entry.course_assignment.faculty.profile.full_name === profile.full_name
        );
      case 'student':
        // For students, you'd typically filter by their batch
        // For demo purposes, showing CS-A 2024 batch
        return timetables.filter(entry => 
          entry.batch.name.includes('CS-A 2024')
        );
      default:
        return timetables;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to timetable changes
    const channel = supabase
      .channel('timetable-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timetables'
        },
        (payload) => {
          console.log('Timetable change received:', payload);
          if (activeRun) {
            fetchTimetables(activeRun);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRun]);

  // Initial data fetch
  useEffect(() => {
    fetchRuns();
  }, []);

  // Fetch timetables when active run changes
  useEffect(() => {
    if (activeRun) {
      fetchTimetables(activeRun);
    }
  }, [activeRun]);

  return {
    timetables: getFilteredTimetables(),
    runs,
    loading,
    activeRun,
    setActiveRun,
    generateTimetable,
    publishTimetable,
    refreshData: () => activeRun && fetchTimetables(activeRun),
  };
};