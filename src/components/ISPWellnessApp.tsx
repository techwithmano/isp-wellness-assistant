'use client';

import React, { useState, useEffect } from 'react';
import WelcomeScreen from './WelcomeScreen';
import ProfileSetupScreen, { ProfileData } from './ProfileSetupScreen';
import ProfileEditScreen from './ProfileEditScreen';
import HistoryScreen from './HistoryScreen';
import TestResultViewScreen from './TestResultViewScreen';
import SymptomInputScreen from './SymptomInputScreen';
import DynamicQuestionScreen, { Question } from './DynamicQuestionScreen';
import ResultsScreen from './ResultsScreen';
import { generateAdaptiveQuestionGroq } from '@/ai/flows/generate-adaptive-question-groq';
import Loading from './Loading';
import { User } from 'lucide-react';
import { getUserProfileByEmail, UserProfile, TestResult } from '@/lib/firebase-service';

type Screen = 'welcome' | 'profile' | 'profile-edit' | 'history' | 'test-result' | 'symptoms' | 'questions' | 'results' | 'loading';

export default function ISPWellnessApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [symptoms, setSymptoms] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading your profile...');
  const [emailError, setEmailError] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);

  const TOTAL_QUESTIONS = 10;

  // Question type distribution ratio: Free text (1), Yes/No (4), Multiple (3), Scale (2), Timeline (0-1)
  // Ratio: text 5% (1), yesno 40% (4), multiple 30% (3), scale 20% (2), timeline 5% (0-1)
  const getRequiredQuestionType = (questionNumber: number, previousTypes: string[]): string => {
    const counts = {
      text: previousTypes.filter(t => t === 'text').length,
      yesno: previousTypes.filter(t => t === 'yesno').length,
      multiple: previousTypes.filter(t => t === 'multiple').length,
      scale: previousTypes.filter(t => t === 'scale').length,
    };

    // Question 1: Free text (ONLY text question - 5%)
    if (questionNumber === 1) return 'text';

    // Questions 2-5: Prioritize Yes/No questions (need 4 total - 40%)
    if (questionNumber >= 2 && questionNumber <= 5) {
      if (counts.yesno < 4) {
        // Distribute yes/no across questions 2-5
        const yesNoSlots = [2, 3, 4, 5];
        const slotIndex = yesNoSlots.indexOf(questionNumber);
        if (slotIndex !== -1 && counts.yesno < slotIndex + 1) {
          return 'yesno';
        }
      }
      // If we have enough yes/no, add multiple choice
      if (counts.multiple < 3 && counts.yesno >= 2) return 'multiple';
      return 'yesno'; // Default to yes/no for early questions
    }

    // Questions 6-8: Mix remaining Yes/No (if needed), Multiple choice (need 3 total - 30%), and Scale (need 2 total - 20%)
    if (questionNumber >= 6 && questionNumber <= 8) {
      // Fill remaining yes/no if needed (should be done by now, but check)
      if (counts.yesno < 4) return 'yesno';
      
      // Prioritize multiple choice (need 3 total)
      if (counts.multiple < 3) {
        if (questionNumber === 6) return 'multiple';
        if (questionNumber === 7 && counts.multiple < 2) return 'multiple';
        if (questionNumber === 8 && counts.multiple < 3) return 'multiple';
      }
      
      // Add scale questions (need 2 total)
      if (counts.scale < 2 && counts.multiple >= 2) {
        if (questionNumber === 7 || questionNumber === 8) return 'scale';
      }
      
      // Fallback
      if (counts.multiple < 3) return 'multiple';
      if (counts.scale < 2) return 'scale';
      return 'multiple';
    }

    // Questions 9-10: Ensure all remaining types are filled
    if (questionNumber === 9) {
      if (counts.scale < 2) return 'scale';
      if (counts.multiple < 3) return 'multiple';
      if (counts.yesno < 4) return 'yesno';
      // Timeline question if everything else is filled (optional)
      return 'timeline';
    }

    if (questionNumber === 10) {
      // Final question - fill any remaining gaps
      if (counts.yesno < 4) return 'yesno';
      if (counts.multiple < 3) return 'multiple';
      if (counts.scale < 2) return 'scale';
      // Default to multiple for better data collection
      return 'multiple';
    }

    return 'yesno'; // Default fallback
  };

  const handleEmailSubmit = async (email: string) => {
    setIsLoadingProfile(true);
    setEmailError('');
    setLoadingMessage('Loading your profile...');
    setCurrentScreen('loading');

    try {
      const userProfile = await getUserProfileByEmail(email);
      
      if (!userProfile) {
        setEmailError('No profile found with this email. Please contact your school coordinator to set up your profile.');
        setCurrentScreen('welcome');
        setIsLoadingProfile(false);
        return;
      }

      // Convert Firebase profile to ProfileData format
      const profileData: ProfileData = {
        name: userProfile.name,
        age: userProfile.age,
        gender: userProfile.gender,
        schoolEmail: userProfile.schoolEmail,
        medicalConditions: userProfile.medicalConditions || '',
      };

      setProfile(profileData);
      setUserProfile(userProfile); // Store full UserProfile with ID for updates
      setCurrentScreen('symptoms');
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setEmailError(error.message || 'Failed to load profile. Please try again.');
      setCurrentScreen('welcome');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileIconClick = () => {
    if (profile && userProfile) {
      setCurrentScreen('profile-edit');
    }
  };

  const handleProfileSave = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    // Update userProfile as well to keep them in sync
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        ...updatedProfile,
      });
    }
  };

  const handleProfileEditBack = () => {
    // Go back to the previous screen (symptoms, questions, or results)
    if (symptoms) {
      if (questions.length > 0) {
        setCurrentScreen('questions');
      } else {
        setCurrentScreen('symptoms');
      }
    } else {
      setCurrentScreen('symptoms');
    }
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleViewTestResult = (testResult: TestResult) => {
    setSelectedTestResult(testResult);
    setCurrentScreen('test-result');
  };

  const handleHistoryBack = () => {
    setCurrentScreen('profile-edit');
  };

  const handleTestResultBack = () => {
    setCurrentScreen('history');
  };

  const handleSymptomsNext = async (symptomsData: string) => {
    setSymptoms(symptomsData);
    setAnswers([]);
    setCurrentQuestionIndex(1);
    setCurrentScreen('loading');

       // Small delay (Groq is fast!)
       setLoadingMessage('Preparing your assessment...');
       await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Generate first question using AI
        setLoadingMessage('Generating your personalized question...');
        console.log('Generating first question with AI...');
        
         // Use Groq only
         const generateFirstWithRetry = async (attempt: number = 1): Promise<any> => {
           const maxRetries = 3;
           const baseDelay = 1000;
           
           try {
             const previousTypes: string[] = [];
             const requiredType = getRequiredQuestionType(1, previousTypes);
             
             return await generateAdaptiveQuestionGroq({
               questionNumber: 1,
               name: profile!.name,
               age: profile!.age,
               gender: profile!.gender,
               symptoms: symptomsData,
               medicalHistory: profile!.medicalConditions || undefined,
               previousAnswers: [],
               allPreviousQuestionTexts: [],
               previousQuestionTypes: previousTypes,
               requiredQuestionType: requiredType,
             });
           } catch (error: any) {
            const isRateLimit = error?.message?.includes('429') || 
                               error?.message?.includes('Too Many Requests') ||
                               error?.message?.includes('rate limit') ||
                               error?.message?.includes('quota');
            
            if (isRateLimit && attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
              setLoadingMessage(`Rate limit reached. Waiting ${delay / 1000}s before retry (${attempt + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              setLoadingMessage('Generating your personalized question...');
              return generateFirstWithRetry(attempt + 1);
            }
            throw error;
          }
        };
        
        const firstQuestionResponse = await generateFirstWithRetry();
        console.log('AI generated first question:', firstQuestionResponse);

      const firstQuestion: Question = {
        id: 1,
        text: firstQuestionResponse.text,
        type: firstQuestionResponse.type,
        options: firstQuestionResponse.options,
      };

      setQuestions([firstQuestion]);
      setCurrentScreen('questions');
    } catch (error: any) {
      console.error('❌ ERROR generating first question with AI:', error);
      
      // Better error message extraction
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      
      console.error('Error details:', errorMessage);
      
      const isRateLimit = errorMessage.includes('429') || 
                         errorMessage.includes('Too Many Requests') ||
                         errorMessage.includes('rate limit') ||
                         errorMessage.includes('quota');
      
      if (isRateLimit) {
        const errorMsg = `API rate limit reached!\n\nPlease wait a moment and try again.\n\n💡 Groq has very high rate limits, so this is rare. If it persists, check: https://console.groq.com/`;
        alert(errorMsg);
      } else if (errorMessage.includes('GROQ_API_KEY')) {
        alert(`❌ Groq API Key Missing!\n\n${errorMessage}\n\nGet your FREE key: https://console.groq.com/`);
      } else {
        alert(`Failed to generate question.\n\n${errorMessage}\n\nPlease check your GROQ_API_KEY in .env.local`);
      }
      
      setCurrentScreen('symptoms');
      return;
    }
  };

  const handleSymptomsBack = () => {
    setCurrentScreen('welcome');
  };

  const handleQuestionAnswer = async (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < TOTAL_QUESTIONS) {
      // Generate next question using AI
      setCurrentScreen('loading');

       // Small delay (Groq is fast!)
       setLoadingMessage('Analyzing your response...');
       await new Promise(resolve => setTimeout(resolve, 300));

      try {
        setLoadingMessage('Generating your next question...');
        // Format previous Q&A with ALL previous question texts explicitly listed
        const allPreviousQuestions = questions.map(q => q.text);
        const previousTypes = questions.map(q => q.type);
        const qaContextArray = questions
          .slice(0, answers.length)
          .map((q, idx) => `Q${idx + 1}: ${q.text}\nAnswer: ${answers[idx] || 'Not answered'}`);

        const requiredType = getRequiredQuestionType(currentQuestionIndex + 1, previousTypes);

        console.log(`Generating question ${currentQuestionIndex + 1} with AI...`);
        console.log('ALL PREVIOUS QUESTION TEXTS (DO NOT REPEAT):', allPreviousQuestions);
        console.log('Previous question types:', previousTypes);
        console.log('Required question type:', requiredType);
        console.log('Previous Q&A context:', qaContextArray);
        
         // Use Groq only
         const generateWithRetry = async (attempt: number = 1): Promise<any> => {
           const maxRetries = 3;
           const baseDelay = 1000;
           
           try {
             return await generateAdaptiveQuestionGroq({
               questionNumber: currentQuestionIndex + 1,
               name: profile!.name,
               age: profile!.age,
               gender: profile!.gender,
               symptoms: symptoms,
               medicalHistory: profile!.medicalConditions || undefined,
               previousAnswers: qaContextArray.length > 0 ? qaContextArray : [],
               allPreviousQuestionTexts: allPreviousQuestions.length > 0 ? allPreviousQuestions : [],
               previousQuestionTypes: previousTypes,
               requiredQuestionType: requiredType,
             });
           } catch (error: any) {
            // Check if it's a rate limit error
            const isRateLimit = error?.message?.includes('429') || 
                               error?.message?.includes('Too Many Requests') ||
                               error?.message?.includes('rate limit') ||
                               error?.message?.includes('quota');
            
            if (isRateLimit && attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
              setLoadingMessage(`Rate limit reached. Waiting ${delay / 1000}s before retry (${attempt + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              setLoadingMessage('Generating your personalized question...');
              return generateWithRetry(attempt + 1);
            }
            throw error;
          }
        };
        
        const nextQuestionResponse = await generateWithRetry();
        console.log(`AI generated question ${currentQuestionIndex + 1}:`, nextQuestionResponse);
        
        // Validate that the new question is not a repeat
        const newQuestionText = nextQuestionResponse.text.toLowerCase().trim();
        const isRepeat = allPreviousQuestions.some(
          prevQ => prevQ.toLowerCase().trim() === newQuestionText || 
          prevQ.toLowerCase().includes(newQuestionText) ||
          newQuestionText.includes(prevQ.toLowerCase())
        );
        
        if (isRepeat) {
          console.warn('⚠️ AI generated a REPEATED question! Retrying...');
          // Retry once with explicit warning
          const retryResponse = await generateAdaptiveQuestionGroq({
            questionNumber: currentQuestionIndex + 1,
            name: profile!.name,
            age: profile!.age,
            gender: profile!.gender,
            symptoms: symptoms,
            medicalHistory: profile!.medicalConditions || undefined,
            previousAnswers: qaContextArray,
            allPreviousQuestionTexts: allPreviousQuestions,
            previousQuestionTypes: previousTypes,
            requiredQuestionType: requiredType,
            retryAttempt: true,
          });
          
          const retryText = retryResponse.text.toLowerCase().trim();
          const retryIsRepeat = allPreviousQuestions.some(
            prevQ => prevQ.toLowerCase().trim() === retryText
          );
          
          if (retryIsRepeat) {
            throw new Error('AI keeps generating repeated questions. Please try again.');
          }
          
          nextQuestionResponse.text = retryResponse.text;
          nextQuestionResponse.type = retryResponse.type;
          nextQuestionResponse.options = retryResponse.options;
        }

        const nextQuestion: Question = {
          id: currentQuestionIndex + 1,
          text: nextQuestionResponse.text,
          type: nextQuestionResponse.type,
          options: nextQuestionResponse.options,
        };

        // Final validation - check if it's a repeat
        const finalCheck = questions.some(q => 
          q.text.toLowerCase().trim() === nextQuestion.text.toLowerCase().trim()
        );
        
        if (finalCheck) {
          throw new Error(`Generated question is a duplicate: "${nextQuestion.text}"`);
        }

        setQuestions((prev) => [...prev, nextQuestion]);
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentScreen('questions');
      } catch (error: any) {
        console.error(`❌ ERROR generating question ${currentQuestionIndex + 1} with AI:`, error);
        
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        
        console.error('Error details:', errorMessage);
        
        const isRateLimit = errorMessage.includes('429') || 
                           errorMessage.includes('Too Many Requests') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('quota');
        
        if (isRateLimit) {
          const errorMsg = `API rate limit reached!\n\nPlease wait a moment and try again.\n\n💡 Groq has very high rate limits, so this is rare. If it persists, check: https://console.groq.com/`;
          alert(errorMsg);
        } else if (errorMessage.includes('GROQ_API_KEY')) {
          alert(`❌ Groq API Key Missing!\n\n${errorMessage}\n\nGet your FREE key: https://console.groq.com/`);
        } else {
          alert(`Failed to generate question.\n\n${errorMessage}\n\nPlease check your GROQ_API_KEY in .env.local`);
        }
        
        // Go back to previous question
        setCurrentQuestionIndex((prev) => prev - 1);
        setAnswers((prev) => prev.slice(0, -1));
        setCurrentScreen('questions');
        return;
      }
    } else {
      // All questions answered, go to results
      setCurrentScreen('results');
    }
  };

  const handleQuestionBack = () => {
    if (currentQuestionIndex > 1) {
      // Go back to previous question - remove last answer and go to previous question
      setAnswers((prev) => prev.slice(0, -1));
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      // Go back to symptoms screen
      setCurrentScreen('symptoms');
      setCurrentQuestionIndex(0);
      setQuestions([]);
      setAnswers([]);
    }
  };

  const handleRestart = () => {
    setCurrentScreen('welcome');
    setProfile(null);
    setSymptoms('');
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
  };

  const currentQuestion = questions[currentQuestionIndex - 1];

  const userInitial = profile?.name?.charAt(0).toUpperCase() || '';
  
  // Show profile icon on all screens except loading, welcome, profile-edit, history, and test-result (only show when profile is loaded)
  const showProfileIcon = currentScreen !== 'loading' && currentScreen !== 'welcome' && currentScreen !== 'profile-edit' && currentScreen !== 'history' && currentScreen !== 'test-result' && profile !== null;

  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Profile Icon Button - Top Right */}
      {showProfileIcon && (
        <button
          onClick={handleProfileIconClick}
          className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 active:scale-95"
          aria-label="View Profile"
          title={profile?.name ? `${profile.name}'s Profile` : 'View Profile'}
        >
          {userInitial ? (
            <span className="text-lg font-semibold">{userInitial}</span>
          ) : (
            <User className="w-6 h-6" />
          )}
        </button>
      )}

      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onEmailSubmit={handleEmailSubmit}
          isLoading={isLoadingProfile}
          error={emailError}
        />
      )}

      {currentScreen === 'profile-edit' && profile && userProfile && (
        <ProfileEditScreen
          profile={profile}
          userProfile={userProfile}
          onSave={handleProfileSave}
          onBack={handleProfileEditBack}
          onViewHistory={handleViewHistory}
        />
      )}

      {currentScreen === 'history' && profile && (
        <HistoryScreen
          userEmail={profile.schoolEmail}
          onBack={handleHistoryBack}
          onViewResult={handleViewTestResult}
        />
      )}

      {currentScreen === 'test-result' && selectedTestResult && (
        <TestResultViewScreen
          testResult={selectedTestResult}
          onBack={handleTestResultBack}
        />
      )}
      
      {currentScreen === 'symptoms' && (
        <SymptomInputScreen
          onNext={handleSymptomsNext}
          onBack={handleSymptomsBack}
        />
      )}

      {currentScreen === 'loading' && (
        <Loading
          title="Processing..."
          description={loadingMessage}
        />
      )}
      
      {currentScreen === 'questions' && currentQuestion && (
        <DynamicQuestionScreen
          question={currentQuestion}
          questionNumber={currentQuestionIndex}
          totalQuestions={TOTAL_QUESTIONS}
          onAnswer={handleQuestionAnswer}
          onBack={handleQuestionBack}
        />
      )}
      
      {currentScreen === 'results' && profile && (
        <ResultsScreen
          profile={profile}
          userProfile={userProfile}
          symptoms={symptoms}
          questions={questions}
          answers={answers}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
