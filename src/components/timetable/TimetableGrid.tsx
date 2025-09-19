import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface TimetableGridProps {
  timetables: TimetableEntry[];
  loading?: boolean;
}

const TimetableGrid = ({ timetables, loading }: TimetableGridProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00'
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
      <Card className="card-3d shadow-professional-lg animate-slide-up">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <span className="gradient-text font-semibold">Weekly Timetable</span>
            <Sparkles className="h-5 w-5 text-secondary animate-float" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-primary/30"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">Generating Timetable</p>
              <p className="text-sm text-muted-foreground animate-shimmer">Please wait while we optimize your schedule...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d shadow-professional-lg overflow-hidden animate-slide-up">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <span className="gradient-text font-semibold">Weekly Timetable</span>
          <Sparkles className="h-5 w-5 text-secondary animate-float" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-muted/30 to-muted/50 backdrop-blur-sm">
              <div className="p-4 font-semibold border-r border-border/50 bg-gradient-to-b from-background/50 to-transparent">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time</span>
              </div>
              {days.map((day, index) => (
                <div 
                  key={day} 
                  className={cn(
                    "p-4 font-semibold text-center border-r border-border/50 last:border-r-0",
                    "bg-gradient-to-b from-background/50 to-transparent",
                    "transition-all-smooth hover:bg-primary/5"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-sm font-medium text-foreground">{day}</span>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {timeSlots.map((time, timeIndex) => (
              <div 
                key={time} 
                className={cn(
                  "grid grid-cols-7 border-b border-border/50 transition-all-smooth",
                  timeIndex % 2 === 0 ? "bg-background/50" : "bg-muted/20",
                  "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent"
                )}
                style={{ animationDelay: `${timeIndex * 0.05}s` }}
              >
                <div className="p-4 font-medium text-muted-foreground border-r border-border/50 bg-gradient-to-r from-background/30 to-transparent">
                  <span className="text-sm font-mono font-semibold">{time.slice(0,5)}</span>
                </div>
                {days.map((day, dayIndex) => {
                  const entry = getTimetableForSlot(dayIndex + 1, time);
                  
                  return (
                    <div 
                      key={`${day}-${time}`} 
                      className={cn(
                        "p-2 border-r border-border/50 last:border-r-0 min-h-[80px]",
                        "transition-all-smooth hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5",
                        "group"
                      )}
                      style={{ animationDelay: `${(timeIndex * 5 + dayIndex) * 0.02}s` }}
                    >
                      {entry ? (
                        <div className={cn(
                          "rounded-xl p-3 h-full text-primary-foreground shadow-professional",
                          "transition-all-smooth hover:shadow-professional-lg hover:scale-105",
                          "border border-white/20 backdrop-blur-sm",
                          "group-hover:animate-pulse-glow",
                          getSubjectColor(entry.course_assignment.course.course_type)
                        )}>
                          <div className="font-semibold text-sm mb-2 leading-tight animate-slide-up">
                            {entry.course_assignment.course.name}
                          </div>
                          <div className="text-xs opacity-90 space-y-1.5">
                            <div className="flex items-center gap-1.5 animate-slide-in-left">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{entry.room.code}</span>
                            </div>
                            <div className="flex items-center gap-1.5 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{entry.course_assignment.faculty.profile.full_name.split(' ').slice(-1)[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                              <GraduationCap className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{entry.batch.name}</span>
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "mt-2 text-xs bg-white/20 text-primary-foreground hover:bg-white/30",
                              "transition-all-smooth hover:scale-105 animate-bounce-in"
                            )}
                            style={{ animationDelay: '0.3s' }}
                          >
                            {entry.course_assignment.course.course_type}
                          </Badge>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-all-smooth">
                          <span className="text-xs font-medium opacity-60 group-hover:opacity-100">Free</span>
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