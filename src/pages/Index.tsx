import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, profile, loading } = useAuth();

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex gap-3">
            {actions.map((action, index) => (
              <Button key={index} variant={action.variant} className="gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats role={profile?.role || 'student'} />

        {/* Recent Activity / Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your classes and activities for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '09:00 AM', subject: 'Data Structures', room: 'Room 101', type: 'Lecture' },
                  { time: '11:00 AM', subject: 'Algorithm Analysis', room: 'Lab 201', type: 'Lab' },
                  { time: '02:00 PM', subject: 'Database Systems', room: 'Room 205', type: 'Lecture' },
                  { time: '04:00 PM', subject: 'Software Engineering', room: 'Room 301', type: 'Tutorial' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border">
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.room} • {item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-secondary" />
                Recent Updates
              </CardTitle>
              <CardDescription>
                Latest changes and announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    title: 'Timetable Updated', 
                    desc: 'CS-A batch schedule modified', 
                    time: '2 hours ago',
                    type: 'update'
                  },
                  { 
                    title: 'New Course Added', 
                    desc: 'Machine Learning Fundamentals', 
                    time: '1 day ago',
                    type: 'new'
                  },
                  { 
                    title: 'Faculty Leave Approved', 
                    desc: 'Dr. Smith - Emergency leave', 
                    time: '2 days ago',
                    type: 'leave'
                  },
                  { 
                    title: 'Room Change', 
                    desc: 'Physics Lab moved to Building B', 
                    time: '3 days ago',
                    type: 'change'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === 'update' ? 'bg-primary' :
                      item.type === 'new' ? 'bg-success' :
                      item.type === 'leave' ? 'bg-warning' : 'bg-accent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
