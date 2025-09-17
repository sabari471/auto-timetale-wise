import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimetableGridProps {
  timetables: any[];
  loading?: boolean;
}

const TimetableGrid = ({ timetables, loading }: TimetableGridProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];
  const timeSlots = [
    '08:45', '09:25', '10:25', '11:35', '12:25', '13:25', '2:15', '15:05', '16:15'
  ];

  const getTimetableForSlot = (day: number, time: string) => {
    return timetables.find(
      entry => entry.day_of_week === day && entry.start_time === time
    );
  };

  const getSubjectColor = (courseType: string) => {
    const colors = {
      theory: 'bg-gradient-primary',
      lab: 'bg-gradient-secondary',
      practical: 'bg-gradient-accent',
      project: 'bg-success'
    };
    return colors[courseType as keyof typeof colors] || 'bg-gradient-primary';
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Weekly Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-card">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Weekly Timetable
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 bg-muted/50">
              <div className="p-4 font-semibold border-r border-border">Time</div>
              {days.map(day => (
                <div key={day} className="p-4 font-semibold text-center border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className={cn(
                "grid grid-cols-6 border-b border-border",
                timeIndex % 2 === 0 ? "bg-background" : "bg-muted/30"
              )}>
                <div className="p-4 font-medium text-muted-foreground border-r border-border">
                  {time}
                </div>
                {days.map((day, dayIndex) => {
                  const entry = getTimetableForSlot(dayIndex + 1, time);
                  
                  return (
                    <div key={`${day}-${time}`} className="p-2 border-r border-border last:border-r-0 min-h-[80px]">
                      {entry ? (
                        <div className={cn(
                          "rounded-lg p-3 h-full text-primary-foreground shadow-sm",
                          getSubjectColor(entry.course_assignment.course.course_type)
                        )}>
                          <div className="font-semibold text-sm mb-1 leading-tight">
                            {entry.course_assignment.course.name}
                          </div>
                          <div className="text-xs opacity-90 space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entry.room.code}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.course_assignment.faculty.profile.full_name.split(' ').slice(-1)[0]}
                            </div>
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {entry.batch.name}
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="mt-2 text-xs bg-white/20 text-primary-foreground hover:bg-white/30"
                          >
                            {entry.course_assignment.course.course_type}
                          </Badge>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground/50">
                          <span className="text-xs">Free</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableGrid;