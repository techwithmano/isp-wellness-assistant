'use client';

import React from 'react';
import { TestResult } from '@/lib/firebase-service';
import { ArrowLeft, Calendar } from 'lucide-react';

interface TestResultViewScreenProps {
  testResult: TestResult;
  onBack: () => void;
}

export default function TestResultViewScreen({ testResult, onBack }: TestResultViewScreenProps) {
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
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Test Result Details
            </h2>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Test Date */}
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span>{formatDate(testResult.createdAt)}</span>
          </div>

          {/* Profile Summary */}
          <div className="mb-8 bg-accent rounded-xl p-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Name:</span>{' '}
                <span className="text-muted-foreground">{testResult.profile.name}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Age:</span>{' '}
                <span className="text-muted-foreground">{testResult.profile.age}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Gender:</span>{' '}
                <span className="text-muted-foreground">{testResult.profile.gender}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Email:</span>{' '}
                <span className="text-muted-foreground">{testResult.profile.schoolEmail}</span>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3">Reported Symptoms</h3>
            <div className="bg-accent rounded-xl p-4">
              <p className="text-foreground whitespace-pre-wrap">{testResult.symptoms}</p>
            </div>
          </div>

          {/* Q&A Summary */}
          {testResult.questions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">Questions & Answers</h3>
              <div className="space-y-4">
                {testResult.questions.map((question, index) => (
                  <div key={question.id || index} className="bg-accent rounded-xl p-4">
                    <p className="font-medium text-foreground mb-2">
                      Q{index + 1}: {question.text}
                    </p>
                    <p className="text-muted-foreground">
                      Answer: {testResult.answers[index] || 'Not answered'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditions/Results */}
          {testResult.conditions && testResult.conditions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">Identified Conditions</h3>
              <div className="space-y-3">
                {testResult.conditions.map((condition: any, index: number) => (
                  <div key={index} className="bg-accent rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">
                        {condition.condition || condition.name || `Condition ${index + 1}`}
                      </h4>
                      {condition.likelihood && (
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                          {typeof condition.likelihood === 'number'
                            ? `${Math.round(condition.likelihood * 100)}%`
                            : condition.likelihood}
                        </span>
                      )}
                    </div>
                    {condition.explanation && (
                      <p className="text-sm text-muted-foreground">{condition.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!testResult.conditions || testResult.conditions.length === 0) && (
            <div className="mb-8 bg-accent rounded-xl p-4">
              <p className="text-muted-foreground">No conditions were identified in this assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

