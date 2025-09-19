import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useTimetable } from '@/hooks/useTimetable';
import { Calendar, Plus, RefreshCw, Download, Sparkles, Zap, TrendingUp, Users, BookOpen, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TodaySchedule {
  time: string;
  subject: string;
  room: string;
  type: string;
  color: string;
}

interface RecentUpdate {
  title: string;
  desc: string;
  time: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { 
    timetables, 
    loading: timetableLoading, 
    generateTimetable,
    refreshData 
  } = useTimetable();
  
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const fetchTodaySchedule = useCallback(async () => {
    try {
      setScheduleLoading(true);
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const dayOfWeekNumber = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
      const dayOfWeek: number = dayOfWeekNumber === 0 ? 7 : dayOfWeekNumber; // Convert to 1=Monday, 7=Sunday

      // Get today's timetable entries
      const { data: timetableEntries, error } = await supabase
        .from('timetables')
        .select(`
          start_time,
          end_time,
          course_assignment:course_assignments(
            course:courses(name, course_type),
          faculty:faculty(
            profile:profiles(id, full_name)
          )
          ),
          room:rooms(name),
          batch:batches(name)
        `)
        .eq('day_of_week', dayOfWeek)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Filter for current user's schedule based on role
      let filteredEntries = timetableEntries || [];
      
      if (profile?.role === 'faculty') {
        // Show only faculty's classes
        filteredEntries = timetableEntries?.filter(entry => 
          entry.course_assignment?.faculty?.profile?.id === profile.id
        ) || [];
      } else if (profile?.role === 'student') {
        // Show only student's batch classes
        filteredEntries = timetableEntries?.filter(entry => 
          entry.batch?.name?.includes(profile.department || '')
        ) || [];
      }

      // Convert to schedule format
      const schedule = filteredEntries.map((entry, index) => ({
        time: entry.start_time?.slice(0, 5) || '09:00',
        subject: entry.course_assignment?.course?.name || 'Unknown Course',
        room: entry.room?.name || 'TBA',
        type: entry.course_assignment?.course?.course_type || 'Lecture',
        color: ['primary', 'secondary', 'accent', 'success'][index % 4]
      }));

      setTodaySchedule(schedule.slice(0, 4)); // Show max 4 classes
    } catch (error) {
      console.error('Error fetching today schedule:', error);
      setTodaySchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, [profile]);

  const fetchRecentUpdates = useCallback(async () => {
    try {
      // Get recent timetable runs
      const { data: recentRuns, error: runsError } = await supabase
        .from('timetable_runs')
        .select('created_at, status')
        .order('created_at', { ascending: false })
        .limit(2);

      // Get recent course assignments
      const { data: recentAssignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          created_at,
          course:courses(name),
          faculty:faculty!course_assignments_faculty_id_fkey(profile:profiles(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      // Get recent leaves
      const { data: recentLeaves, error: leavesError } = await supabase
        .from('leaves')
        .select(`
          created_at,
          status,
          faculty:faculty!leaves_faculty_id_fkey(profile:profiles(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      const updates: RecentUpdate[] = [];

      // Add timetable updates
      recentRuns?.forEach(run => {
        updates.push({
          title: 'Timetable Updated',
          desc: `New schedule generated - ${run.status}`,
          time: getTimeAgo(run.created_at),
          type: 'update',
          icon: Calendar
        });
      });

      // Add course assignments
      recentAssignments?.forEach(assignment => {
        updates.push({
          title: 'New Course Assignment',
          desc: `${assignment.course?.name} assigned`,
          time: getTimeAgo(assignment.created_at),
          type: 'new',
          icon: BookOpen
        });
      });

      // Add leave updates
      recentLeaves?.forEach(leave => {
        updates.push({
          title: 'Leave Request',
          desc: `${leave.faculty?.profile?.full_name} - ${leave.status}`,
          time: getTimeAgo(leave.created_at),
          type: 'leave',
          icon: Users
        });
      });

      setRecentUpdates(updates.slice(0, 4)); // Show max 4 updates
    } catch (error) {
      console.error('Error fetching recent updates:', error);
      setRecentUpdates([]);
    }
  }, []);

  useEffect(() => {
    fetchTodaySchedule();
    fetchRecentUpdates();
  }, [fetchTodaySchedule, fetchRecentUpdates]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getRoleGreeting = () => {
    switch (profile?.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Manage timetables, faculty, and system configuration',
          actions: [
            { label: 'Generate Timetable', icon: Plus, variant: 'hero' as const },
            { label: 'Sync Data', icon: RefreshCw, variant: 'secondary' as const },
            { label: 'Export Reports', icon: Download, variant: 'outline' as const }
          ]
        };
      case 'faculty':
        return {
          title: 'Faculty Portal',
          subtitle: 'View your schedule, manage leaves, and track teaching assignments',
          actions: [
            { label: 'Request Leave', icon: Calendar, variant: 'secondary' as const },
            { label: 'Download Schedule', icon: Download, variant: 'outline' as const }
          ]
        };
      default:
        return {
          title: 'Student Portal',
          subtitle: 'Access your personalized timetable and stay updated with changes',
          actions: [
            { label: 'View Full Schedule', icon: Calendar, variant: 'default' as const },
            { label: 'Export to Calendar', icon: Download, variant: 'outline' as const }
          ]
        };
    }
  };

  const { title, subtitle, actions } = getRoleGreeting();

  const handleGenerateTimetable = async () => {
    try {
      await generateTimetable({
        algorithm: 'genetic',
        max_iterations: 500,
        population_size: 30
      });
    } catch (error) {
      console.error('Failed to generate timetable:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-slide-up">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse-glow">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold gradient-text">
                Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
              </h1>
            </div>
            <p className="text-xl text-muted-foreground font-medium animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              {subtitle}
            </p>
          </div>
          <div className="flex gap-3 animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
            {actions.map((action, index) => (
              <Button 
                key={index} 
                variant={action.variant} 
                className={cn(
                  "gap-2 btn-press transition-all-smooth",
                  "hover:shadow-professional-lg hover:scale-105",
                  action.label === 'Generate Timetable' && "animate-pulse-glow"
                )}
                onClick={action.label === 'Generate Timetable' ? handleGenerateTimetable : undefined}
                disabled={action.label === 'Generate Timetable' ? timetableLoading : false}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                {action.label === 'Generate Timetable' && timetableLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <action.icon className="h-4 w-4" />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats role={profile?.role || 'student'} />

        {/* Timetable Grid */}
        <TimetableGrid timetables={timetables} loading={timetableLoading} />

        {/* Recent Activity / Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-3d shadow-professional-lg animate-slide-in-left" style={{ animationDelay: '0.8s' }}>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="gradient-text font-semibold">Today's Schedule</span>
                <Zap className="h-4 w-4 text-secondary animate-float" />
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Your classes and activities for today
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-muted-foreground">Loading today's schedule...</span>
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No classes scheduled for today</p>
                  </div>
                ) : (
                  todaySchedule.map((item, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all-smooth",
                      "hover:shadow-professional hover:scale-105 hover:bg-gradient-to-r",
                      `hover:from-${item.color}/5 hover:to-transparent`,
                      "animate-scale-in"
                    )}
                    style={{ animationDelay: `${1.0 + index * 0.1}s` }}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{item.subject}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{item.room}</span>
                        <span>•</span>
                        <span className="font-medium">{item.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">{item.time}</p>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d shadow-professional-lg animate-slide-in-right" style={{ animationDelay: '0.8s' }}>
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <RefreshCw className="h-5 w-5 text-secondary" />
                </div>
                <span className="gradient-text font-semibold">Recent Updates</span>
                <TrendingUp className="h-4 w-4 text-accent animate-float" />
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Latest changes and announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent updates</p>
                  </div>
                ) : (
                  recentUpdates.map((item, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl transition-all-smooth",
                      "hover:shadow-professional hover:scale-105 hover:bg-gradient-to-r",
                      "hover:from-primary/5 hover:to-transparent",
                      "animate-scale-in"
                    )}
                    style={{ animationDelay: `${1.0 + index * 0.1}s` }}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-all-smooth",
                      item.type === 'update' ? 'bg-primary/10' :
                      item.type === 'new' ? 'bg-success/10' :
                      item.type === 'leave' ? 'bg-warning/10' : 'bg-accent/10'
                    )}>
                      <item.icon className={cn(
                        "h-4 w-4",
                        item.type === 'update' ? 'text-primary' :
                        item.type === 'new' ? 'text-success' :
                        item.type === 'leave' ? 'text-warning' : 'text-accent'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">{item.time}</span>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
