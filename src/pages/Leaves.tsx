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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Leave {
  id: string;
  faculty_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  substitute_faculty_id?: string;
  created_at: string;
  faculty: {
    profile: {
      full_name: string;
      email: string;
    };
    employee_id: string;
  };
  substitute_faculty?: {
    profile: {
      full_name: string;
    };
  };
}

interface Faculty {
  id: string;
  employee_id: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
}

const Leaves = () => {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
    substitute_faculty_id: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchFaculty();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      console.log('Fetching leaves from database...');
      
      // Fetch from database with proper joins
      const { data: dbLeaves, error } = await supabase
        .from('leaves')
        .select(`
          *,
          faculty!leaves_faculty_id_fkey(
            id,
            employee_id,
            profile:profiles(id, full_name, email)
          ),
          substitute_faculty:faculty!leaves_substitute_faculty_id_fkey(
            id,
            employee_id,
            profile:profiles(id, full_name, email)
          ),
          approved_by_profile:profiles!leaves_approved_by_fkey(
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Database leaves result:', { dbLeaves, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const processedLeaves = (dbLeaves || []).map(leave => ({
        ...leave,
        faculty: leave.faculty || { 
          id: '', 
          employee_id: '', 
          profile: { id: '', full_name: 'Unknown Faculty', email: '' } 
        },
        substitute_faculty: leave.substitute_faculty || undefined,
        approved_by_profile: leave.approved_by_profile || undefined
      }));
      
      console.log('Processed leaves:', processedLeaves);
      setLeaves(processedLeaves);
    } catch (error: unknown) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
      toast({
        title: "Error",
        description: "Failed to load leave requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .select(`
          id,
          employee_id,
          profile:profiles(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('employee_id');

      if (error) throw error;
      setFaculty(data || []);
    } catch (error: unknown) {
      console.error('Error fetching faculty:', error);
    }
  };

  const getCurrentUserFaculty = async () => {
    // If faculty data is not loaded, fetch it first
    if (faculty.length === 0) {
      await fetchFaculty();
    }
    
    // Try to find faculty by profile ID
    let currentFaculty = faculty.find(f => f.profile.id === profile?.id);
    
    // If not found, try to find by profile email as fallback
    if (!currentFaculty && profile?.email) {
      currentFaculty = faculty.find(f => f.profile.email === profile.email);
    }
    
    // If still not found, try to create a faculty record for the current user
    if (!currentFaculty && profile?.role === 'faculty') {
      console.log('Creating faculty record for current user...');
      try {
        const { data: newFaculty, error } = await supabase
          .from('faculty')
          .insert([{
            profile_id: profile.id,
            employee_id: `FAC${Date.now().toString().slice(-3)}`,
            department_id: null,
            designation: 'Faculty',
            specialization: [],
            max_hours_per_week: 20,
            is_active: true
          }])
          .select(`
            id,
            employee_id,
            profile:profiles(id, full_name, email)
          `)
          .single();
          
        if (!error && newFaculty) {
          setFaculty(prev => [...prev, newFaculty]);
          return newFaculty;
        }
      } catch (error) {
        console.error('Error creating faculty record:', error);
      }
    }
    
    return currentFaculty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const currentFaculty = await getCurrentUserFaculty();
      if (!currentFaculty) {
        toast({
          title: "Error",
          description: "Faculty profile not found. Please contact admin to set up your faculty profile.",
          variant: "destructive",
        });
        return;
      }

      console.log('Submitting leave request for faculty:', currentFaculty.id);

      // Insert into database
      const { data: newLeave, error } = await supabase
        .from('leaves')
        .insert([{
          faculty_id: currentFaculty.id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          substitute_faculty_id: formData.substitute_faculty_id || null,
          status: 'pending'
        }])
        .select(`
          *,
          faculty!leaves_faculty_id_fkey(
            id,
            employee_id,
            profile:profiles(id, full_name, email)
          ),
          substitute_faculty:faculty!leaves_substitute_faculty_id_fkey(
            id,
            employee_id,
            profile:profiles(id, full_name, email)
          )
        `)
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Successfully created leave:', newLeave);
      
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchLeaves();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit leave request",
        variant: "destructive",
      });
    }
  };

  const findSuitableSubstituteFaculty = async (originalFacultyId: string) => {
    try {
      // Get courses assigned to the original faculty
      const { data: originalAssignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          course_id,
          course:courses(id, name, code, course_type, department_id)
        `)
        .eq('faculty_id', originalFacultyId)
        .eq('academic_year', '2024-25')
        .eq('semester', 5);
      
      if (assignmentsError || !originalAssignments || originalAssignments.length === 0) {
        console.log('No course assignments found for original faculty');
        return null;
      }
      
      const courseIds = originalAssignments.map(a => a.course_id);
      const departmentIds = originalAssignments.map(a => a.course.department_id).filter(Boolean);
      
      console.log('Looking for substitute for courses:', courseIds);
      console.log('In departments:', departmentIds);
      
      // Find faculty who can handle these courses (same department or have taught similar courses)
      const { data: potentialSubstitutes, error: facultyError } = await supabase
        .from('faculty')
        .select(`
          id,
          employee_id,
          department_id,
          profile:profiles(id, full_name, email)
        `)
        .eq('is_active', true)
        .neq('id', originalFacultyId);
      
      if (facultyError || !potentialSubstitutes) {
        console.error('Error fetching potential substitutes:', facultyError);
        return null;
      }
      
      // Find faculty who have taught courses in the same department or similar courses
      const suitableSubstitutes = [];
      
      for (const faculty of potentialSubstitutes) {
        // Check if they have taught courses in the same department
        const { data: theirAssignments, error: theirError } = await supabase
          .from('course_assignments')
          .select(`
            course:courses(department_id, course_type)
          `)
          .eq('faculty_id', faculty.id)
          .eq('academic_year', '2024-25')
          .eq('semester', 5);
        
        if (theirError || !theirAssignments) continue;
        
        // Check if they have taught courses in the same department
        const hasSameDepartment = theirAssignments.some(assignment => 
          departmentIds.includes(assignment.course.department_id)
        );
        
        if (hasSameDepartment) {
          suitableSubstitutes.push(faculty);
        }
      }
      
      console.log('Found suitable substitutes:', suitableSubstitutes);
      
      // Return the first suitable substitute (you could implement more sophisticated selection logic)
      return suitableSubstitutes.length > 0 ? suitableSubstitutes[0] : null;
      
    } catch (error) {
      console.error('Error finding substitute faculty:', error);
      return null;
    }
  };

  const reassignTimetableForLeave = async (leave: Leave) => {
    try {
      console.log('Reassigning timetable for leave:', leave);
      
      let substituteFacultyId = leave.substitute_faculty_id;
      
      // If no substitute faculty is specified, try to find one automatically
      if (!substituteFacultyId) {
        console.log('No substitute faculty specified, searching for suitable substitute...');
        const autoSubstitute = await findSuitableSubstituteFaculty(leave.faculty_id);
        if (autoSubstitute) {
          substituteFacultyId = autoSubstitute.id;
          console.log('Found automatic substitute:', autoSubstitute.profile.full_name);
        } else {
          console.log('No suitable substitute faculty found, skipping reassignment');
          toast({
            title: "Warning",
            description: "No suitable substitute faculty found for the courses. Please assign manually.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Get all course assignments for the faculty on leave
      const { data: courseAssignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(id, name, code, course_type),
          faculty:faculty(id, employee_id, profile:profiles(full_name)),
          batch:batches(id, name, section)
        `)
        .eq('faculty_id', leave.faculty_id)
        .eq('academic_year', '2024-25')
        .eq('semester', 5);
      
      if (assignmentsError) {
        console.error('Error fetching course assignments:', assignmentsError);
        return;
      }
      
      if (!courseAssignments || courseAssignments.length === 0) {
        console.log('No course assignments found for this faculty');
        return;
      }
      
      console.log(`Found ${courseAssignments.length} course assignments to reassign`);
      
      // Get substitute faculty details
      const { data: substituteFaculty, error: subError } = await supabase
        .from('faculty')
        .select(`
          id,
          employee_id,
          profile:profiles(id, full_name, email)
        `)
        .eq('id', substituteFacultyId)
        .single();
      
      if (subError || !substituteFaculty) {
        console.error('Error fetching substitute faculty:', subError);
        return;
      }
      
      console.log('Substitute faculty:', substituteFaculty);
      
      // Create new course assignments for the substitute faculty
      const newAssignments = courseAssignments.map(assignment => ({
        course_id: assignment.course_id,
        faculty_id: substituteFacultyId!,
        batch_id: assignment.batch_id,
        academic_year: assignment.academic_year,
        semester: assignment.semester,
        hours_per_week: assignment.hours_per_week
      }));
      
      // Insert new course assignments for substitute faculty
      const { data: insertedAssignments, error: insertError } = await supabase
        .from('course_assignments')
        .insert(newAssignments)
        .select(`
          *,
          course:courses(id, name, code, course_type),
          faculty:faculty(id, employee_id, profile:profiles(full_name)),
          batch:batches(id, name, section)
        `);
      
      if (insertError) {
        console.error('Error creating substitute assignments:', insertError);
        return;
      }
      
      console.log(`Successfully created ${insertedAssignments?.length || 0} substitute course assignments`);
      
      // Store reassignment info in localStorage for timetable display
      const reassignmentInfo = {
        leave_id: leave.id,
        original_faculty_id: leave.faculty_id,
        substitute_faculty_id: substituteFacultyId,
        substitute_faculty: substituteFaculty,
        course_assignments: insertedAssignments,
        created_at: new Date().toISOString()
      };
      
      const existingReassignments = JSON.parse(localStorage.getItem('timetableReassignments') || '[]');
      const newReassignments = [...existingReassignments, reassignmentInfo];
      localStorage.setItem('timetableReassignments', JSON.stringify(newReassignments));
      
      console.log('Successfully reassigned courses to substitute faculty');
      
      toast({
        title: "Timetable Updated",
        description: `${insertedAssignments?.length || 0} courses reassigned to ${substituteFaculty.profile.full_name}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error reassigning timetable:', error);
      toast({
        title: "Error",
        description: "Failed to reassign timetable entries",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (leaveId: string, status: string) => {
    try {
      console.log('Updating leave status:', { leaveId, status });
      
      // Update in database
      const { error } = await supabase
        .from('leaves')
        .update({ 
          status,
          approved_by: profile?.id || null
        })
        .eq('id', leaveId);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      // If approved, trigger timetable reassignment
      if (status === 'approved') {
        const approvedLeave = leaves.find(leave => leave.id === leaveId);
        if (approvedLeave) {
          await reassignTimetableForLeave(approvedLeave);
        }
      }
      
      toast({
        title: "Success",
        description: `Leave request ${status}${status === 'approved' ? ' and timetable updated' : ''}`,
      });
      
      // Refresh the leaves list
      await fetchLeaves();
    } catch (error: unknown) {
      console.error('Error updating leave status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update leave status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      leave_type: 'casual',
      start_date: '',
      end_date: '',
      reason: '',
      substitute_faculty_id: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
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
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Leave Management</h1>
            <p className="text-muted-foreground">
              Manage leave requests and approvals
            </p>
          </div>
          
          {(profile?.role === 'faculty' || profile?.role === 'admin') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); }} className="btn-press">
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request Leave</DialogTitle>
                  <DialogDescription>
                    Submit a new leave request
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave_type">Leave Type</Label>
                    <Select value={formData.leave_type} onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="vacation">Vacation Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="substitute_faculty_id">Substitute Faculty (Optional)</Label>
                    <Select value={formData.substitute_faculty_id} onValueChange={(value) => setFormData(prev => ({ ...prev, substitute_faculty_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select substitute faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((facultyMember) => (
                          <SelectItem key={facultyMember.id} value={facultyMember.id}>
                            {facultyMember.profile.full_name} ({facultyMember.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Please provide reason for leave"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Submit Request
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="card-3d shadow-professional-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Leave Requests
            </CardTitle>
            <CardDescription>
              {leaves.length} leave requests in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Substitute</TableHead>
                  <TableHead>Status</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={profile?.role === 'admin' ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Calendar className="h-8 w-8" />
                        <p>No leave requests found</p>
                        <p className="text-sm">Submit a leave request to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{leave.faculty.profile.full_name}</div>
                        <div className="text-sm text-muted-foreground">{leave.faculty.employee_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {leave.leave_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {leave.substitute_faculty?.profile.full_name || 'None'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(leave.status)}
                        <Badge variant={getStatusVariant(leave.status)} className="capitalize">
                          {leave.status}
                        </Badge>
                      </div>
                    </TableCell>
                    {profile?.role === 'admin' && leave.status === 'pending' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(leave.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaves;