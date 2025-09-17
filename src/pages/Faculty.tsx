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
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Faculty {
  id: string;
  employee_id: string;
  designation: string;
  specialization: string[];
  max_hours_per_week: number;
  is_active: boolean;
  profile: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const Faculty = () => {
  const { profile } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    designation: '',
    specialization: '',
    max_hours_per_week: 40,
    department_id: ''
  });

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .select(`
          *,
          profile:profiles(full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaculty(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch faculty",
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
      if (editingFaculty) {
        // Update existing faculty
        // Update faculty record only - profile updates require special handling
        const { error: facultyError } = await supabase
          .from('faculty')
          .update({
            employee_id: formData.employee_id,
            designation: formData.designation,
            specialization: formData.specialization.split(',').map(s => s.trim()),
            max_hours_per_week: formData.max_hours_per_week,
            department_id: formData.department_id || null
          })
          .eq('id', editingFaculty.id);

        if (facultyError) throw facultyError;


        toast({
          title: "Success",
          description: "Faculty updated successfully",
        });
      } else {
        // For new faculty, we create a temporary user_id (admin should handle user creation separately)
        const tempUserId = crypto.randomUUID();
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: tempUserId,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: 'faculty'
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Then create faculty record
        const { error: facultyError } = await supabase
          .from('faculty')
          .insert([{
            profile_id: profileData.id,
            employee_id: formData.employee_id,
            designation: formData.designation,
            specialization: formData.specialization.split(',').map(s => s.trim()),
            max_hours_per_week: formData.max_hours_per_week,
            department_id: formData.department_id || null
          }]);

        if (facultyError) throw facultyError;

        toast({
          title: "Success",
          description: "Faculty created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingFaculty(null);
      resetForm();
      fetchFaculty();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save faculty",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (facultyMember: Faculty) => {
    setEditingFaculty(facultyMember);
    setFormData({
      full_name: facultyMember.profile.full_name,
      email: facultyMember.profile.email,
      phone: facultyMember.profile.phone || '',
      employee_id: facultyMember.employee_id,
      designation: facultyMember.designation || '',
      specialization: facultyMember.specialization?.join(', ') || '',
      max_hours_per_week: facultyMember.max_hours_per_week,
      department_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      const { error } = await supabase
        .from('faculty')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Faculty deleted successfully",
      });
      fetchFaculty();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete faculty",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      employee_id: '',
      designation: '',
      specialization: '',
      max_hours_per_week: 40,
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
            <h1 className="text-3xl font-bold tracking-tight">Faculty</h1>
            <p className="text-muted-foreground">
              Manage faculty members and their information
            </p>
          </div>
          
          {profile?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingFaculty(null); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFaculty ? 'Update faculty information' : 'Add a new faculty member to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="e.g., Dr. John Smith"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                        placeholder="e.g., FAC001"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john.smith@university.edu"
                      disabled={!!editingFaculty}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Select value={formData.designation} onValueChange={(value) => setFormData(prev => ({ ...prev, designation: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professor">Professor</SelectItem>
                          <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                          <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                          <SelectItem value="Senior Lecturer">Senior Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g., Machine Learning, Data Structures"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_hours">Maximum Hours per Week</Label>
                    <Input
                      id="max_hours"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.max_hours_per_week}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_hours_per_week: parseInt(e.target.value) }))}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingFaculty ? 'Update' : 'Create'} Faculty
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
              <Users className="h-5 w-5" />
              Faculty Members
            </CardTitle>
            <CardDescription>
              {faculty.length} faculty members in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Max Hours/Week</TableHead>
                  <TableHead>Status</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map((facultyMember) => (
                  <TableRow key={facultyMember.id}>
                    <TableCell className="font-medium">{facultyMember.profile.full_name}</TableCell>
                    <TableCell>{facultyMember.employee_id}</TableCell>
                    <TableCell>{facultyMember.profile.email}</TableCell>
                    <TableCell>{facultyMember.designation}</TableCell>
                    <TableCell>{facultyMember.max_hours_per_week}</TableCell>
                    <TableCell>
                      <Badge variant={facultyMember.is_active ? "default" : "secondary"}>
                        {facultyMember.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(facultyMember)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(facultyMember.id)}>
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

export default Faculty;