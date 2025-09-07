import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import WelcomeOnboarding from './WelcomeOnboarding';

const OnboardingGate: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isLearner = user?.role === 'student' || user?.role === 'self-learner';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student_profile'],
    queryFn: async () => {
      try {
        return await api.getStudentProfile();
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!isLearner,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const needsOnboarding = !!isLearner && !isLoading && (!profile || !profile.learningStyle);

  if (!needsOnboarding) return null;

  const initial = profile
    ? { interests: profile.interests?.join(', ') || '', hobbies: profile.hobbies?.join(', ') || '', format: (profile.learningStyle as any)?.toLowerCase() as 'video'|'text'|'mixed' }
    : undefined;

  return (
    <WelcomeOnboarding
      open
      mandatory
      initial={initial}
      onCancel={() => { /* mandatory: no-op */ }}
      onFinish={async (data) => {
        const payload = {
          interests: (data.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
          hobbies: (data.hobbies || '').split(',').map((s) => s.trim()).filter(Boolean),
          learningStyle: (data.format || 'mixed').toUpperCase() as any,
        };
        const created = await api.postStudentOnboarding(payload as any);
        qc.setQueryData(['student_profile'], created);
      }}
    />
  );
};

export default OnboardingGate;

