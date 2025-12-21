import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ProfileData } from '@/components/ProfileSetupScreen';

const USERS_COLLECTION = 'users';

export interface UserProfile extends ProfileData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Fetch user profile by school email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = email.toLowerCase().trim();

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('schoolEmail', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No user found with email: ${normalizedEmail}`);
      return null;
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      name: userData.name || '',
      age: userData.age || '',
      gender: userData.gender || '',
      schoolEmail: userData.schoolEmail || normalizedEmail,
      medicalConditions: userData.medicalConditions || '',
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile. Please check your internet connection and try again.');
  }
}

/**
 * Get user profile by document ID
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      name: userData.name || '',
      age: userData.age || '',
      gender: userData.gender || '',
      schoolEmail: userData.schoolEmail || '',
      medicalConditions: userData.medicalConditions || '',
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
    throw new Error('Failed to fetch user profile.');
  }
}

/**
 * Update user profile in Firebase
 * Note: schoolEmail cannot be updated
 */
export async function updateUserProfile(userId: string, profileData: Partial<ProfileData>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    
    // Prepare update data (exclude schoolEmail from updates)
    const updateData: any = {
      name: profileData.name,
      age: profileData.age,
      gender: profileData.gender,
      medicalConditions: profileData.medicalConditions || '',
      updatedAt: Timestamp.now(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Test Result/History interfaces
 */
export interface TestResult {
  id?: string;
  userId: string; // User's document ID from users collection
  userEmail: string; // User's email for easy querying
  profile: ProfileData; // Profile snapshot at time of test
  symptoms: string;
  questions: Array<{ id: number; text: string; type: string; options?: string[] }>;
  answers: string[];
  conditions?: any; // SymptomAnalysisOutput
  createdAt: Date;
}

const TEST_RESULTS_COLLECTION = 'testResults';

/**
 * Save a test result to Firebase
 */
export async function saveTestResult(testResult: Omit<TestResult, 'id' | 'createdAt'>): Promise<string> {
  try {
    const testResultsRef = collection(db, TEST_RESULTS_COLLECTION);
    
    // Remove undefined values (Firestore doesn't allow undefined)
    const cleanTestResult: any = {
      userId: testResult.userId || '',
      userEmail: testResult.userEmail || '',
      profile: testResult.profile || {},
      symptoms: testResult.symptoms || '',
      questions: testResult.questions || [],
      answers: testResult.answers || [],
      createdAt: Timestamp.now(),
    };
    
    // Only add conditions if it exists and is not undefined
    if (testResult.conditions !== undefined && testResult.conditions !== null) {
      cleanTestResult.conditions = testResult.conditions;
    }
    
    const docRef = await addDoc(testResultsRef, cleanTestResult);
    return docRef.id;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw new Error('Failed to save test result. Please try again.');
  }
}

/**
 * Get all test results for a user (by email)
 */
export async function getUserTestHistory(userEmail: string): Promise<TestResult[]> {
  try {
    const normalizedEmail = userEmail.toLowerCase().trim();
    const testResultsRef = collection(db, TEST_RESULTS_COLLECTION);
    const q = query(testResultsRef, where('userEmail', '==', normalizedEmail), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        profile: data.profile,
        symptoms: data.symptoms,
        questions: data.questions,
        answers: data.answers,
        conditions: data.conditions,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as TestResult;
    });
  } catch (error) {
    console.error('Error fetching test history:', error);
    throw new Error('Failed to fetch test history. Please try again.');
  }
}

