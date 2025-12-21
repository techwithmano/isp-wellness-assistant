'use client';

import React, { useEffect, useState } from 'react';
import { getUserTestHistory, TestResult } from '@/lib/firebase-service';
import { ProfileData } from './ProfileSetupScreen';
import { Calendar, ArrowLeft, FileText } from 'lucide-react';

interface HistoryScreenProps {
  userEmail: string;
  onBack: () => void;
  onViewResult: (testResult: TestResult) => void;
}

export default function HistoryScreen({ userEmail, onBack, onViewResult }: HistoryScreenProps) {
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const history = await getUserTestHistory(userEmail);
        setTestHistory(history);
      } catch (err: any) {
        console.error('Error loading test history:', err);
        setError(err.message || 'Failed to load test history');
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail) {
      loadHistory();
    }
  }, [userEmail]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fadeIn">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-3xl shadow-xl p-6 sm:p-8 mb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Test History
            </h2>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading your test history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-4">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && testHistory.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">No test history yet</p>
              <p className="text-muted-foreground">Complete an assessment to see your results here</p>
            </div>
          )}

          {/* Test History List */}
          {!isLoading && !error && testHistory.length > 0 && (
            <div className="space-y-4">
              {testHistory.map((test, index) => (
                <div
                  key={test.id || index}
                  className="bg-accent rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onViewResult(test)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Test #{testHistory.length - index}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(test.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResult(test);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Test Summary */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Main Symptoms:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {test.symptoms || 'No symptoms recorded'}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{test.questions.length}</span> questions answered
                      </span>
                      {test.conditions && test.conditions.length > 0 && (
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{test.conditions.length}</span> conditions identified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

