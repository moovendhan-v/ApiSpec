'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MapPin, 
  Calendar, 
  Edit, 
  Save,
  X,
  User,
  Shield,
  Bell,
  Lock,
  Trash2,
  Upload,
  Camera,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: Date;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({} as UserProfile);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-blue-500/20">
                    <AvatarImage src={profile?.avatarUrl || '/api/placeholder/128/128'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-3xl">
                      {getInitials(profile?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit mx-auto md:mx-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-slate-400 mb-4">{profile.email}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span>
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span>Verified Email</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your personal details and information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name ?? ''}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                        className="bg-white/5 border-white/20 text-white disabled:opacity-70 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email ?? ''}
                        disabled={true}
                        className="bg-white/5 border-white/20 text-white disabled:opacity-70"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 pt-4 border-t border-white/10"
                    >
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Account Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">12</div>
                      <div className="text-sm text-slate-400">API Specifications</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">5</div>
                      <div className="text-sm text-slate-400">Shared Documents</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">3</div>
                      <div className="text-sm text-slate-400">Team Members</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Password & Security</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Change Password</h3>
                          <p className="text-sm text-slate-400">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white">
                        Update
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-slate-400">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white">
                        Enable
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-white font-medium mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm">Current Session</p>
                          <p className="text-xs text-slate-400">Chrome on MacOS • Auroville, India</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-red-500/5 backdrop-blur-xl border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Irreversible actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-red-500/20">
                    <div>
                      <h3 className="text-white font-medium">Delete Account</h3>
                      <p className="text-sm text-slate-400">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { title: 'Email Notifications', desc: 'Receive email updates about your account activity' },
                    { title: 'API Updates', desc: 'Get notified when someone shares an API spec with you' },
                    { title: 'Security Alerts', desc: 'Receive alerts about account security' },
                    { title: 'Marketing Emails', desc: 'Receive tips, updates, and special offers' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}