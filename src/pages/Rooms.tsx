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
import { Plus, MapPin, Edit, Trash2, Monitor, Wifi, Thermometer } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Room {
  id: string;
  name: string;
  code: string;
  capacity: number;
  room_type: string;
  facilities: string[];
  is_active: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const Rooms = () => {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 30,
    room_type: 'lecture',
    facilities: [] as string[],
    department_id: ''
  });

  useEffect(() => {
    fetchRooms();
    fetchDepartments();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
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
      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(formData)
          .eq('id', editingRoom.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingRoom(null);
      resetForm();
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save room",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      room_type: room.room_type,
      facilities: room.facilities || [],
      department_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      capacity: 30,
      room_type: 'lecture',
      facilities: [],
      department_id: ''
    });
  };

  const toggleFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
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
            <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
            <p className="text-muted-foreground">
              Manage classrooms, labs, and other facilities
            </p>
          </div>
          
          {profile?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingRoom(null); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRoom ? 'Edit Room' : 'Add New Room'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRoom ? 'Update room information' : 'Create a new room for scheduling'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Main Lecture Hall 1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Room Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., LH-101"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        max="500"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="room_type">Room Type</Label>
                      <Select value={formData.room_type} onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lecture">Lecture Hall</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                          <SelectItem value="tutorial">Tutorial Room</SelectItem>
                          <SelectItem value="seminar">Seminar Hall</SelectItem>
                          <SelectItem value="conference">Conference Room</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Facilities</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'projector', label: 'Projector', icon: Monitor },
                        { key: 'ac', label: 'Air Conditioning', icon: Thermometer },
                        { key: 'wifi', label: 'WiFi', icon: Wifi },
                        { key: 'computers', label: 'Computers', icon: Monitor },
                        { key: 'whiteboard', label: 'Whiteboard', icon: MapPin },
                        { key: 'sound', label: 'Sound System', icon: MapPin }
                      ].map((facility) => (
                        <div
                          key={facility.key}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            formData.facilities.includes(facility.key)
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleFacility(facility.key)}
                        >
                          <facility.icon className="h-4 w-4" />
                          <span className="text-sm">{facility.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRoom ? 'Update' : 'Create'} Room
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
              <MapPin className="h-5 w-5" />
              All Rooms
            </CardTitle>
            <CardDescription>
              {rooms.length} rooms available for scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Status</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {room.room_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{room.capacity} seats</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.facilities?.map((facility) => (
                          <Badge key={facility} variant="secondary" className="text-xs">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={room.is_active ? "default" : "secondary"}>
                        {room.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(room.id)}>
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

export default Rooms;
