'use client';

import React, { useState, useEffect } from 'react';
import { ProfileData } from './ProfileSetupScreen';
import { updateUserProfile, UserProfile } from '@/lib/firebase-service';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Heart, History, ArrowLeft, Save, Edit2 } from 'lucide-react';

interface ProfileEditScreenProps {
  profile: ProfileData;
  userProfile: UserProfile;
  onSave: (updatedProfile: ProfileData) => void;
  onBack: () => void;
  onViewHistory: () => void;
}

export default function ProfileEditScreen({ profile, userProfile, onSave, onBack, onViewHistory }: ProfileEditScreenProps) {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const userInitial = profile.name?.charAt(0).toUpperCase() || 'U';

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (saveMessage) {
      setSaveMessage('');
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    if (!userProfile.id) {
      setSaveMessage('Error: User ID not found. Cannot save changes.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Update in Firebase
      await updateUserProfile(userProfile.id, formData);
      
      // Update local state
      onSave(formData);
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setSaveMessage(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/20 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-6 border border-border/50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-card shadow-lg">
                <Edit2 className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile.schoolEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Age {profile.age}</span>
                </div>
              </div>
              {profile.medicalConditions && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span>{profile.medicalConditions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Personal Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed transition-all"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
                </div>

                {/* Age and Gender Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div>
                    <label htmlFor="age" className="block text-sm font-semibold text-foreground mb-2">
                      Age *
                    </label>
                    <input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed transition-all"
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                    />
                    {errors.age && <p className="mt-1 text-sm text-destructive">{errors.age}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-semibold text-foreground mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed transition-all"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-destructive">{errors.gender}</p>}
                  </div>
                </div>

                {/* School Email - Read Only */}
                <div>
                  <label htmlFor="schoolEmail" className="block text-sm font-semibold text-foreground mb-2">
                    School Email
                  </label>
                  <input
                    id="schoolEmail"
                    type="email"
                    value={formData.schoolEmail}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-muted text-muted-foreground text-lg cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Contact your school coordinator to change your email
                  </p>
                </div>

                {/* Medical Conditions */}
                <div>
                  <label htmlFor="medicalConditions" className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Medical Conditions (Optional)
                  </label>
                  <textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => handleChange('medicalConditions', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-muted disabled:cursor-not-allowed transition-all"
                    placeholder="List any existing medical conditions..."
                  />
                </div>

                {/* Save Message */}
                {saveMessage && (
                  <div className={`p-4 rounded-xl ${saveMessage.includes('successfully') ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                    <p className="text-sm font-medium">{saveMessage}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(profile);
                        setErrors({});
                        setSaveMessage('');
                      }}
                      disabled={isSaving}
                      className="flex-1 py-3 px-6 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Test History Card */}
            <div className="bg-card rounded-2xl shadow-xl p-6 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Test History</h3>
                  <p className="text-sm text-muted-foreground">View past assessments</p>
                </div>
              </div>
              <button
                onClick={onViewHistory}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                View History
              </button>
            </div>

            {/* Profile Stats (Optional - can add more later) */}
            <div className="bg-card rounded-2xl shadow-xl p-6 border border-border/50">
              <h3 className="text-lg font-bold text-foreground mb-4">Profile Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium text-foreground">
                    {userProfile.createdAt ? new Date(userProfile.createdAt).getFullYear() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="font-medium text-foreground">
                    {userProfile.updatedAt 
                      ? new Date(userProfile.updatedAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
