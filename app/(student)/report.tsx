import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { TrendingUp, BookOpen, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useMyConceptStats, useMyLogs } from '../../src/hooks/useReport';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { ConceptStat, MyLog } from '../../src/types';

export default function ReportScreen() {
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: conceptStats, isLoading: conceptLoading } = useMyConceptStats(profile?.id ?? '');
  const { data: myLogs, isLoading: logsLoading } = useMyLogs(profile?.id ?? '');

  if (conceptLoading || logsLoading) return <LoadingSpinner fullScreen />;

  const totalCorrect = (conceptStats ?? []).reduce((s, c) => s + c.correct, 0);
  const totalAnswered = (conceptStats ?? []).reduce((s, c) => s + c.total, 0);
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const ConceptSection = <ConceptStatsSection stats={conceptStats ?? []} />;
  const HistorySection = <HistorySection logs={myLogs ?? []} />;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* 헤더 */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">학습 리포트</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{profile?.display_name}님의 학습 현황</Text>
      </View>

      {/* 요약 카드 */}
      <View className="flex-row gap-3 px-4 py-4">
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
          <TrendingUp size={20} color="#3B82F6" />
          <Text className="text-2xl font-bold text-gray-900 mt-1">
            {overallAccuracy}
            <Text className="text-base font-normal text-gray-400">%</Text>
          </Text>
          <Text className="text-xs text-gray-500">전체 정답률</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
          <BookOpen size={20} color="#10B981" />
          <Text className="text-2xl font-bold text-gray-900 mt-1">{myLogs?.length ?? 0}</Text>
          <Text className="text-xs text-gray-500">응시 퀴즈</Text>
        </View>
      </View>

      {/* 태블릿: 2열 / 모바일: 세로 스크롤 */}
      {isTablet ? (
        <View className="flex-row px-4 gap-3">
          <View className="flex-1">{ConceptSection}</View>
          <View className="flex-1">{HistorySection}</View>
        </View>
      ) : (
        <View className="px-4 gap-3">
          {ConceptSection}
          {HistorySection}
        </View>
      )}
    </ScrollView>
  );
}

function ConceptStatsSection({ stats }: { stats: ConceptStat[] }) {
  if (stats.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 border border-gray-100 items-center py-8">
        <Text className="text-gray-400 text-sm">아직 응시한 퀴즈가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <Text className="text-sm font-semibold text-gray-700 mb-3">개념별 정답률</Text>
      <View className="gap-3">
        {stats.map((stat) => {
          const isWeak = stat.accuracy < 60;
          const isGood = stat.accuracy >= 80;
          const barColor = isWeak ? '#EF4444' : isGood ? '#10B981' : '#3B82F6';
          const textColor = isWeak ? 'text-error' : isGood ? 'text-success' : 'text-primary';

          return (
            <View key={stat.concept_tag}>
              <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center gap-1">
                  {isWeak && <AlertTriangle size={12} color="#EF4444" />}
                  <Text className="text-sm text-gray-700">{stat.concept_tag}</Text>
                </View>
                <Text className={`text-sm font-semibold ${textColor}`}>{stat.accuracy}%</Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full">
                <View
                  className="h-2 rounded-full"
                  style={{ width: `${stat.accuracy}%`, backgroundColor: barColor }}
                />
              </View>
              <Text className="text-xs text-gray-400 mt-0.5 text-right">
                {stat.correct}/{stat.total}문제
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HistorySection({ logs }: { logs: MyLog[] }) {
  if (logs.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 border border-gray-100 items-center py-8">
        <Text className="text-gray-400 text-sm">응시 이력이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <Text className="text-sm font-semibold text-gray-700 mb-3">응시 이력</Text>
      <View className="gap-2.5">
        {logs.map((log) => {
          const isGood = log.accuracy >= 80;
          const isWeak = log.accuracy < 60;
          const badgeBg = isGood ? 'bg-green-100' : isWeak ? 'bg-red-100' : 'bg-blue-100';
          const badgeText = isGood ? 'text-success' : isWeak ? 'text-error' : 'text-primary';

          return (
            <View key={log.quiz_set_id} className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-sm text-gray-800" numberOfLines={1}>{log.quiz_title}</Text>
                <Text className="text-xs text-gray-400">{log.correct}/{log.total}문제 정답</Text>
              </View>
              <View className={`rounded-full px-2.5 py-0.5 ${badgeBg}`}>
                <Text className={`text-sm font-bold ${badgeText}`}>{log.accuracy}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
