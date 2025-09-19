import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarChart3, TrendingUp, Users, BookOpen, MapPin, Clock, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AnalyticsData {
  totalFaculty: number;
  totalCourses: number;
  totalBatches: number;
  totalRooms: number;
  totalAssignments: number;
  totalTimetables: number;
  facultyUtilization: Array<{
    faculty_name: string;
    hours_assigned: number;
    max_hours: number;
    utilization_percentage: number;
  }>;
  roomUtilization: Array<{
    room_name: string;
    slots_used: number;
    total_slots: number;
    utilization_percentage: number;
  }>;
  courseDistribution: Array<{
    course_type: string;
    count: number;
  }>;
}

const Analytics = () => {
  const { profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch basic counts
      const [facultyResult, coursesResult, batchesResult, roomsResult, assignmentsResult, timetablesResult] = await Promise.all([
        supabase.from('faculty').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('courses').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('batches').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('rooms').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('course_assignments').select('id', { count: 'exact' }),
        supabase.from('timetables').select('id', { count: 'exact' })
      ]);

      // Fetch faculty utilization
      const { data: facultyUtilization } = await supabase
        .from('course_assignments')
        .select(`
          faculty:faculty!inner(
            profile:profiles(full_name),
            max_hours_per_week
          ),
          hours_per_week
        `);

      // Fetch room utilization
      const { data: roomUtilization } = await supabase
        .from('timetables')
        .select(`
          room:rooms(name),
          day_of_week,
          start_time
        `);

      // Fetch course distribution
      const { data: courseDistribution } = await supabase
        .from('courses')
        .select('course_type')
        .eq('is_active', true);

      // Process faculty utilization
      const facultyUtilMap = new Map();
      facultyUtilization?.forEach(assignment => {
        const facultyName = assignment.faculty.profile.full_name;
        const maxHours = assignment.faculty.max_hours_per_week || 20;
        const currentHours = facultyUtilMap.get(facultyName)?.hours_assigned || 0;
        facultyUtilMap.set(facultyName, {
          faculty_name: facultyName,
          hours_assigned: currentHours + (assignment.hours_per_week || 0),
          max_hours: maxHours,
          utilization_percentage: 0
        });
      });

      // Calculate utilization percentages
      const processedFacultyUtil = Array.from(facultyUtilMap.values()).map(faculty => ({
        ...faculty,
        utilization_percentage: Math.round((faculty.hours_assigned / faculty.max_hours) * 100)
      }));

      // Process room utilization
      const roomUtilMap = new Map();
      roomUtilization?.forEach(timetable => {
        const roomName = timetable.room.name;
        const current = roomUtilMap.get(roomName) || { room_name: roomName, slots_used: 0, total_slots: 40 }; // 5 days * 8 slots
        roomUtilMap.set(roomName, {
          ...current,
          slots_used: current.slots_used + 1
        });
      });

      const processedRoomUtil = Array.from(roomUtilMap.values()).map(room => ({
        ...room,
        utilization_percentage: Math.round((room.slots_used / room.total_slots) * 100)
      }));

      // Process course distribution
      const courseDistMap = new Map();
      courseDistribution?.forEach(course => {
        const type = course.course_type;
        courseDistMap.set(type, (courseDistMap.get(type) || 0) + 1);
      });

      const processedCourseDist = Array.from(courseDistMap.entries()).map(([course_type, count]) => ({
        course_type,
        count
      }));

      setAnalyticsData({
        totalFaculty: facultyResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalBatches: batchesResult.count || 0,
        totalRooms: roomsResult.count || 0,
        totalAssignments: assignmentsResult.count || 0,
        totalTimetables: timetablesResult.count || 0,
        facultyUtilization: processedFacultyUtil,
        roomUtilization: processedRoomUtil,
        courseDistribution: processedCourseDist
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your timetable system
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-3d shadow-professional animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{analyticsData?.totalFaculty}</div>
              <p className="text-xs text-muted-foreground">Active faculty members</p>
            </CardContent>
          </Card>

          <Card className="card-3d shadow-professional animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{analyticsData?.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card className="card-3d shadow-professional animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
              <MapPin className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{analyticsData?.totalRooms}</div>
              <p className="text-xs text-muted-foreground">Available rooms</p>
            </CardContent>
          </Card>

          <Card className="card-3d shadow-professional animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Slots</CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{analyticsData?.totalTimetables}</div>
              <p className="text-xs text-muted-foreground">Time slots scheduled</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Utilization */}
        <Card className="card-3d shadow-professional-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Faculty Utilization
            </CardTitle>
            <CardDescription>
              Teaching hours vs maximum capacity for each faculty member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Hours Assigned</TableHead>
                  <TableHead>Max Hours</TableHead>
                  <TableHead>Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData?.facultyUtilization.map((faculty, index) => (
                  <TableRow key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TableCell className="font-medium">{faculty.faculty_name}</TableCell>
                    <TableCell>{faculty.hours_assigned}h</TableCell>
                    <TableCell>{faculty.max_hours}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all-smooth ${
                              faculty.utilization_percentage > 80 ? 'bg-success' :
                              faculty.utilization_percentage > 60 ? 'bg-primary' :
                              faculty.utilization_percentage > 40 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${Math.min(faculty.utilization_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{faculty.utilization_percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Room Utilization */}
        <Card className="card-3d shadow-professional-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary" />
              Room Utilization
            </CardTitle>
            <CardDescription>
              Time slots usage across all rooms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Slots Used</TableHead>
                  <TableHead>Total Slots</TableHead>
                  <TableHead>Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData?.roomUtilization.map((room, index) => (
                  <TableRow key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TableCell className="font-medium">{room.room_name}</TableCell>
                    <TableCell>{room.slots_used}</TableCell>
                    <TableCell>{room.total_slots}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all-smooth ${
                              room.utilization_percentage > 80 ? 'bg-success' :
                              room.utilization_percentage > 60 ? 'bg-primary' :
                              room.utilization_percentage > 40 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${Math.min(room.utilization_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{room.utilization_percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Course Distribution */}
        <Card className="card-3d shadow-professional-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Course Distribution
            </CardTitle>
            <CardDescription>
              Distribution of courses by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {analyticsData?.courseDistribution.map((course, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-2xl font-bold gradient-text">{course.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{course.course_type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
