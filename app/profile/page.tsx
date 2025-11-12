'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, MapPin, Calendar, Edit } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { User } from '@prisma/client';
import { profile } from 'console';
import { format } from 'path';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const { theme } = useTheme();
  const [profile, setProfile] = useState<User>({} as User);
  const [loading, setLoading] = useState(true);

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
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-white">Profile</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            <CardDescription className="text-slate-400">
              Manage your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 pb-6 border-b border-white/10">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/api/placeholder/80/80" />
                <AvatarFallback className="bg-blue-600 text-white text-xl">JD</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                <p className="text-sm text-slate-400">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  defaultValue={profile.name ?? ''}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white disabled:opacity-70"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  defaultValue={profile.email ?? ''}
                  disabled={true}
                  className="bg-white/5 border-white/20 text-white disabled:opacity-70"
                />
              </div>

            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Account Information</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}