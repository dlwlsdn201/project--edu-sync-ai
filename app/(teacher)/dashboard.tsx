import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../src/hooks/useAuth';
import { useRealtimeLogs } from '../../src/hooks/useRealtimeLogs';
import { getOrCreateDefaultClassroom } from '../../src/api/quiz';
import { getClassroomStats } from '../../src/api/logs';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import type { Classroom, ClassroomStats, StudentResult } from '../../src/types';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    getOrCreateDefaultClassroom(profile.id)
      .then(setClassroom)
      .catch((err) => Alert.alert('오류', err.message));
  }, [profile?.id]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['classroomStats', classroom?.id ?? ''],
    queryFn: () => getClassroomStats(classroom!.id),
    enabled: !!classroom?.id,
  });

  useRealtimeLogs(classroom?.id ?? '');

  if (isLoading || !classroom) return <LoadingSpinner fullScreen />;

  return (
    <ScreenContent>
      <View className="flex-1">
        <View className="bg-white pt-14 pb-4 border-b border-gray-100 -mx-5 px-5">
          <Text className="text-2xl font-bold text-gray-900">실시간 현황</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{classroom.name} · 입장코드 <Text className="font-bold text-primary">{classroom.entry_code}</Text></Text>
        </View>

        <FlatList
          className="flex-1"
          data={stats?.student_results ?? []}
          keyExtractor={(item) => item.student_id}
          renderItem={({ item }) => <StudentCard item={item} />}
          ListHeaderComponent={<Header stats={stats} />}
          ListFooterComponent={<ConceptSummary stats={stats} />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{ paddingVertical: 16, gap: 10 }}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
        />
      </View>
    </ScreenContent>
  );
}

function Header({ stats }: { stats?: ClassroomStats }) {
  return (
    <View className="flex-row gap-3 mb-4">
      <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
        <Users size={20} color="#3B82F6" />
        <Text className="text-2xl font-bold text-gray-900 mt-1">
          {stats?.answered_students ?? 0}
          <Text className="text-base font-normal text-gray-400">/{stats?.total_students ?? 0}</Text>
        </Text>
        <Text className="text-xs text-gray-500">응시 완료</Text>
      </View>
      <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
        <TrendingUp size={20} color="#10B981" />
        <Text className="text-2xl font-bold text-gray-900 mt-1">
          {stats?.avg_accuracy ?? 0}
          <Text className="text-base font-normal text-gray-400">%</Text>
        </Text>
        <Text className="text-xs text-gray-500">평균 정답률</Text>
      </View>
    </View>
  );
}

function StudentCard({ item }: { item: StudentResult }) {
  const notAnswered = item.accuracy < 0;
  const isWeak = !notAnswered && item.accuracy < 60;
  const isGood = !notAnswered && item.accuracy >= 80;

  let borderColor = 'border-blue-200';
  let bgColor = 'bg-blue-50';
  let textColor = 'text-primary';

  if (notAnswered) { borderColor = 'border-gray-200'; bgColor = 'bg-gray-50'; textColor = 'text-gray-400'; }
  else if (isWeak) { borderColor = 'border-red-200'; bgColor = 'bg-red-50'; textColor = 'text-error'; }
  else if (isGood) { borderColor = 'border-green-200'; bgColor = 'bg-green-50'; textColor = 'text-success'; }

  return (
    <View className={`flex-1 border-2 rounded-2xl p-4 items-center ${borderColor} ${bgColor}`}>
      <Text className="text-lg font-bold text-gray-900">
        {item.display_name.length > 4 ? item.display_name.slice(0, 4) + '…' : item.display_name}
      </Text>
      <Text className={`text-2xl font-bold mt-1 ${textColor}`}>
        {notAnswered ? '—' : `${item.accuracy}%`}
      </Text>
      {!notAnswered && (
        <Text className="text-xs text-gray-400 mt-0.5">{item.correct}/{item.total} 정답</Text>
      )}
      {notAnswered && (
        <Text className="text-xs text-gray-400 mt-0.5">미응시</Text>
      )}
    </View>
  );
}

function ConceptSummary({ stats }: { stats?: ClassroomStats }) {
  if (!stats || (stats.weak_concepts.length === 0 && stats.strong_concepts.length === 0)) return null;

  return (
    <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
      <Text className="text-sm font-semibold text-gray-700 mb-3">개념 분석</Text>
      {stats.weak_concepts.length > 0 && (
        <View className="mb-2">
          <View className="flex-row items-center mb-1.5">
            <AlertTriangle size={14} color="#EF4444" />
            <Text className="text-xs font-medium text-error ml-1">취약 개념</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {stats.weak_concepts.map((tag) => (
              <View key={tag} className="bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                <Text className="text-xs text-error">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {stats.strong_concepts.length > 0 && (
        <View>
          <View className="flex-row items-center mb-1.5">
            <CheckCircle2 size={14} color="#10B981" />
            <Text className="text-xs font-medium text-success ml-1">강점 개념</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {stats.strong_concepts.map((tag) => (
              <View key={tag} className="bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                <Text className="text-xs text-success">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center py-12">
      <Users size={40} color="#D1D5DB" />
      <Text className="text-base text-gray-400 mt-3">아직 응시한 학생이 없습니다.</Text>
      <Text className="text-sm text-gray-400">학생이 퀴즈를 풀면 자동으로 표시됩니다.</Text>
    </View>
  );
}

