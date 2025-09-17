import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, BookOpen, Edit, Trash2, Users, GraduationCap } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface CourseAssignment {
  id: string;
  academic_year: string;
  semester: number;
  hours_per_week: number;
  course: {
    id: string;
    name: string;
    code: string;
    course_type: string;
  };
  faculty: {
    id: string;
    employee_id: string;
    profile: {
      full_name: string;
    };
  };
  batch: {
    id: string;
    name: string;
    section: string;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
  course_type: string;
}

interface Faculty {
  id: string;
  employee_id: string;
  profile: {
    full_name: string;
  };
}

interface Batch {
  id: string;
  name: string;
  section: string;
}

const CourseAssignments = () => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CourseAssignment | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    faculty_id: '',
    batch_id: '',
    academic_year: '2024-25',
    semester: 1,
    hours_per_week: 3
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchFaculty();
    fetchBatches();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(id, name, code, course_type),
          faculty:faculty(
            id, 
            employee_id,
            profile:profiles(full_name)
          ),
          batch:batches(id, name, section)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch course assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code, course_type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .select(`
          id,
          employee_id,
          profile:profiles(full_name)
        `)
        .eq('is_active', true)
        .order('employee_id');

      if (error) throw error;
      setFaculty(data || []);
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, section')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('course_assignments')
          .update(formData)
          .eq('id', editingAssignment.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course assignment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('course_assignments')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course assignment created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save course assignment",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (assignment: CourseAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      course_id: assignment.course.id,
      faculty_id: assignment.faculty.id,
      batch_id: assignment.batch.id,
      academic_year: assignment.academic_year,
      semester: assignment.semester,
      hours_per_week: assignment.hours_per_week
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Course assignment deleted successfully",
      });
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      faculty_id: '',
      batch_id: '',
      academic_year: '2024-25',
      semester: 1,
      hours_per_week: 3
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Course Assignments</h1>
            <p className="text-muted-foreground">
              Assign courses to faculty and batches for timetable generation
            </p>
          </div>
          
          {profile?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingAssignment(null); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment ? 'Edit Assignment' : 'Create Course Assignment'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignment ? 'Update the course assignment' : 'Assign a course to a faculty member and batch'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {course.code} - {course.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select value={formData.faculty_id} onValueChange={(value) => setFormData(prev => ({ ...prev, faculty_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((facultyMember) => (
                          <SelectItem key={facultyMember.id} value={facultyMember.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {facultyMember.employee_id} - {facultyMember.profile.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
                    <Select value={formData.batch_id} onValueChange={(value) => setFormData(prev => ({ ...prev, batch_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {batch.name} {batch.section && `- Section ${batch.section}`}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic_year">Academic Year</Label>
                      <Select value={formData.academic_year} onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2026-27">2026-27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={formData.semester.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, semester: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours_per_week">Hours per Week</Label>
                    <Select value={formData.hours_per_week.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, hours_per_week: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map(hours => (
                          <SelectItem key={hours} value={hours.toString()}>{hours} hours</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAssignment ? 'Update' : 'Create'} Assignment
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Assignments
            </CardTitle>
            <CardDescription>
              {assignments.length} course assignments configured for timetable generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Hours/Week</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.course.code}</div>
                        <div className="text-sm text-muted-foreground">{assignment.course.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.faculty.profile.full_name}</div>
                        <div className="text-sm text-muted-foreground">{assignment.faculty.employee_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {assignment.batch.name}
                        {assignment.batch.section && ` - ${assignment.batch.section}`}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.academic_year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Sem {assignment.semester}</Badge>
                    </TableCell>
                    <TableCell>{assignment.hours_per_week}h</TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(assignment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(assignment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CourseAssignments;