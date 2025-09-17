import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  course_type: string;
  duration_minutes: number;
  is_active: boolean;
  semester: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const Courses = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    course_type: 'theory',
    duration_minutes: 60,
    semester: 1,
    department_id: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save course",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      credits: course.credits,
      course_type: course.course_type,
      duration_minutes: course.duration_minutes,
      semester: course.semester || 1,
      department_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      credits: 3,
      course_type: 'theory',
      duration_minutes: 60,
      semester: 1,
      department_id: ''
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
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              Manage course catalog and academic subjects
            </p>
          </div>
          
          {(profile?.role === 'admin') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCourse(null); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCourse ? 'Update course information' : 'Create a new course in the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Data Structures and Algorithms"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., CS301"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="6"
                        value={formData.credits}
                        onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                        required
                      />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course_type">Course Type</Label>
                      <Select value={formData.course_type} onValueChange={(value) => setFormData(prev => ({ ...prev, course_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory">Theory</SelectItem>
                          <SelectItem value="practical">Practical</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="30"
                        max="180"
                        step="15"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCourse ? 'Update' : 'Create'} Course
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
              All Courses
            </CardTitle>
            <CardDescription>
              {courses.length} courses available in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {course.course_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>{course.duration_minutes} min</TableCell>
                    <TableCell>Sem {course.semester}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_active ? "default" : "secondary"}>
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)}>
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

export default Courses;