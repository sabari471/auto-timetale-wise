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
      const { data, error } = await supabase
        .from('leaves')
        .select(`
          *,
          faculty!leaves_faculty_id_fkey(
            employee_id,
            profile:profiles(full_name, email)
          ),
          substitute_faculty:faculty!leaves_substitute_faculty_id_fkey(
            profile:profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaves(data?.map(leave => ({
        ...leave,
        faculty: leave.faculty || { employee_id: '', profile: { full_name: 'Unknown', email: '' } },
        substitute_faculty: leave.substitute_faculty || undefined
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch leaves",
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
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
    }
  };

  const getCurrentUserFaculty = () => {
    return faculty.find(f => f.profile.id === profile?.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const currentFaculty = getCurrentUserFaculty();
      if (!currentFaculty) {
        toast({
          title: "Error",
          description: "Faculty profile not found",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('leaves')
        .insert([{
          faculty_id: currentFaculty.id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          substitute_faculty_id: formData.substitute_faculty_id || null
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchLeaves();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (leaveId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({
          status,
          approved_by: profile?.id
        })
        .eq('id', leaveId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Leave request ${status}`,
      });
      
      fetchLeaves();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave status",
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
                {leaves.map((leave) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaves;