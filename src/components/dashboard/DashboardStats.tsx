import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 ${gradient} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${gradient}`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${changeColor} flex items-center gap-1 mt-1`}>
            <TrendingUp className="h-3 w-3" />
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  role: 'admin' | 'faculty' | 'student';
}

const DashboardStats = ({ role }: DashboardStatsProps) => {
  // Mock data - in real app this would come from API
  const getStatsForRole = () => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Total Timetables',
            value: 24,
            change: '+12% from last month',
            changeType: 'positive' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'Active Faculty',
            value: 156,
            change: '+3 this week',
            changeType: 'positive' as const,
            icon: Users,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Total Courses',
            value: 89,
            change: '+7 this semester',
            changeType: 'positive' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Pending Leaves',
            value: 5,
            change: '2 urgent',
            changeType: 'negative' as const,
            icon: AlertCircle,
            gradient: 'bg-destructive'
          }
        ];
      case 'faculty':
        return [
          {
            title: 'Classes This Week',
            value: 18,
            change: 'Regular schedule',
            changeType: 'neutral' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'Teaching Hours',
            value: '24h',
            change: '+2h from last week',
            changeType: 'positive' as const,
            icon: Clock,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Courses Assigned',
            value: 4,
            change: 'Across 3 batches',
            changeType: 'neutral' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Leave Balance',
            value: 12,
            change: 'Days remaining',
            changeType: 'positive' as const,
            icon: Calendar,
            gradient: 'bg-success'
          }
        ];
      default: // student
        return [
          {
            title: 'Classes Today',
            value: 6,
            change: '2 labs, 4 lectures',
            changeType: 'neutral' as const,
            icon: Calendar,
            gradient: 'bg-gradient-primary'
          },
          {
            title: 'This Week',
            value: 32,
            change: 'Total class hours',
            changeType: 'neutral' as const,
            icon: Clock,
            gradient: 'bg-gradient-secondary'
          },
          {
            title: 'Subjects',
            value: 8,
            change: 'This semester',
            changeType: 'neutral' as const,
            icon: BookOpen,
            gradient: 'bg-gradient-accent'
          },
          {
            title: 'Attendance',
            value: '94%',
            change: '+2% this month',
            changeType: 'positive' as const,
            icon: TrendingUp,
            gradient: 'bg-success'
          }
        ];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;