import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, Clock, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

const StatCard = ({ title, value, change, changeType = 'neutral', icon: Icon, gradient = 'bg-gradient-primary' }: StatCardProps) => {
  const changeColor = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  }[changeType];

  return (
    <Card className={cn(
      "card-3d shadow-professional transition-all-smooth",
      "hover:shadow-professional-lg hover:scale-105",
      "animate-scale-in"
    )}>
      <div className={cn(
        "absolute inset-0 opacity-5 transition-all-smooth",
        gradient
      )} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn(
          "p-3 rounded-xl transition-all-smooth hover:scale-110",
          "shadow-professional",
          gradient
        )}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold gradient-text">{value}</div>
        {change && (
          <div className={cn(
            "flex items-center gap-2 text-xs font-medium",
            changeColor
          )}>
            <TrendingUp className="h-3 w-3" />
            <span>{change}</span>
            <Sparkles className="h-3 w-3 animate-float" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  role: 'admin' | 'faculty' | 'student';
}

interface StatsData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

const DashboardStats = ({ role }: DashboardStatsProps) => {
  const [stats, setStats] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [role]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsData = await getStatsForRole();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatsForRole = async (): Promise<StatsData[]> => {
    switch (role) {
      case 'admin':
        // Fetch admin stats
        const [timetablesResult, facultyResult, coursesResult, leavesResult] = await Promise.all([
          supabase.from('timetable_runs').select('id', { count: 'exact' }),
          supabase.from('faculty').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('courses').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'pending')
        ]);

        return [
          {
            title: 'Total Timetables',
            value: timetablesResult.count || 0,
            change: 'Generated schedules',
            changeType: 'positive' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'Active Faculty',
            value: facultyResult.count || 0,
            change: 'Teaching staff',
            changeType: 'positive' as const,
            icon: Users,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Total Courses',
            value: coursesResult.count || 0,
            change: 'Available courses',
            changeType: 'positive' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Pending Leaves',
            value: leavesResult.count || 0,
            change: 'Awaiting approval',
            changeType: leavesResult.count && leavesResult.count > 0 ? 'negative' as const : 'neutral' as const,
            icon: AlertCircle,
            gradient: 'bg-destructive'
          }
        ];
      case 'faculty':
        // Fetch faculty-specific stats (would need faculty ID from context)
        const [facultyAssignmentsResult, facultyHoursResult] = await Promise.all([
          supabase.from('course_assignments').select('id', { count: 'exact' }),
          supabase.from('course_assignments').select('hours_per_week')
        ]);

        const totalHours = facultyHoursResult.data?.reduce((sum, assignment) => sum + (assignment.hours_per_week || 0), 0) || 0;

        return [
          {
            title: 'Classes This Week',
            value: facultyAssignmentsResult.count || 0,
            change: 'Assigned courses',
            changeType: 'neutral' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'Teaching Hours',
            value: `${totalHours}h`,
            change: 'Weekly commitment',
            changeType: 'positive' as const,
            icon: Clock,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Courses Assigned',
            value: facultyAssignmentsResult.count || 0,
            change: 'Active assignments',
            changeType: 'neutral' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Leave Balance',
            value: 'N/A',
            change: 'Contact admin',
            changeType: 'neutral' as const,
            icon: Calendar,
            gradient: 'bg-success'
          }
        ];
      default: // student
        // Fetch student-specific stats
        const [studentTimetablesResult, studentCoursesResult] = await Promise.all([
          supabase.from('timetables').select('id', { count: 'exact' }),
          supabase.from('courses').select('id', { count: 'exact' }).eq('is_active', true)
        ]);

        return [
          {
            title: 'Classes Today',
            value: studentTimetablesResult.count || 0,
            change: 'Scheduled classes',
            changeType: 'neutral' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'This Week',
            value: (studentTimetablesResult.count || 0) * 5,
            change: 'Total class hours',
            changeType: 'neutral' as const,
            icon: Clock,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Subjects',
            value: studentCoursesResult.count || 0,
            change: 'Available courses',
            changeType: 'neutral' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Attendance',
            value: 'N/A',
            change: 'Contact faculty',
            changeType: 'neutral' as const,
            icon: TrendingUp,
            gradient: 'bg-success'
          }
        ];
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="animate-pulse">
            <Card className="h-32">
              <CardContent className="flex items-center justify-center h-full">
                <LoadingSpinner size="sm" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;