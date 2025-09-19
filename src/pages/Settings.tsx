import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Database, Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserSettings {
  full_name: string;
  email: string;
  phone: string;
  department: string;
  avatar_url: string;
}

interface SystemSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  dark_mode: boolean;
  auto_refresh: boolean;
  default_academic_year: string;
  default_semester: number;
}

const Settings = () => {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    avatar_url: ''
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    notifications_enabled: true,
    email_notifications: true,
    dark_mode: false,
    auto_refresh: true,
    default_academic_year: '2024-25',
    default_semester: 1
  });

  useEffect(() => {
    fetchSettings();
  }, [profile]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      if (profile) {
        setUserSettings({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          department: profile.department || '',
          avatar_url: profile.avatar_url || ''
        });
      }

      // Load system settings from localStorage
      const savedSystemSettings = localStorage.getItem('systemSettings');
      if (savedSystemSettings) {
        setSystemSettings(JSON.parse(savedSystemSettings));
      }

    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSettingsSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userSettings.full_name,
          phone: userSettings.phone,
          department: userSettings.department,
          avatar_url: userSettings.avatar_url
        })
        .eq('id', profile?.id);

      if (error) throw error;

      // Update local profile
      await updateProfile();

      toast({
        title: "Success",
        description: "Profile settings updated successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSettingsSave = () => {
    try {
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
      
      toast({
        title: "Success",
        description: "System settings saved successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
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
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and system preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Profile Settings */}
          <Card className="card-3d shadow-professional-lg animate-slide-in-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={userSettings.full_name}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userSettings.phone}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={userSettings.department}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter your department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={userSettings.avatar_url}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="Enter avatar image URL"
                />
              </div>

              <Button 
                onClick={handleUserSettingsSave} 
                disabled={saving}
                className="w-full btn-press"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="card-3d shadow-professional-lg animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-secondary" />
                System Preferences
              </CardTitle>
              <CardDescription>
                Configure your application preferences and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold">Notifications</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show system notifications</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={systemSettings.notifications_enabled}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, notifications_enabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={systemSettings.email_notifications}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, email_notifications: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Appearance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-success" />
                  <h4 className="font-semibold">Appearance</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark_mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch
                    id="dark_mode"
                    checked={systemSettings.dark_mode}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, dark_mode: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_refresh">Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">Automatically refresh data</p>
                  </div>
                  <Switch
                    id="auto_refresh"
                    checked={systemSettings.auto_refresh}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, auto_refresh: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Defaults */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-warning" />
                  <h4 className="font-semibold">Defaults</h4>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Default Academic Year</Label>
                  <Select 
                    value={systemSettings.default_academic_year} 
                    onValueChange={(value) => 
                      setSystemSettings(prev => ({ ...prev, default_academic_year: value }))
                    }
                  >
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
                  <Label htmlFor="semester">Default Semester</Label>
                  <Select 
                    value={systemSettings.default_semester.toString()} 
                    onValueChange={(value) => 
                      setSystemSettings(prev => ({ ...prev, default_semester: parseInt(value) }))
                    }
                  >
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

              <Button 
                onClick={handleSystemSettingsSave}
                className="w-full btn-press"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <Card className="card-3d shadow-professional-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                <h4 className="font-semibold mb-2">Account Security</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your account is secured with Supabase authentication. For password changes or account recovery, 
                  please contact your system administrator.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Email Verified</Badge>
                  <Badge variant="outline" className="text-xs">Secure Login</Badge>
                  <Badge variant="outline" className="text-xs">Role: {profile?.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
