import { Tabs } from 'expo-router';
import { BookOpen, TrendingUp, UserCircle } from 'lucide-react-native';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#F3F4F6' },
      }}
    >
      <Tabs.Screen
        name="quiz-list"
        options={{
          title: '퀴즈',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      {/* 구 join 라우트 — 탭에서는 숨기고 퀴즈 탭으로 리다이렉트만 유지 */}
      <Tabs.Screen name="join" options={{ href: null }} />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{ href: null }}
      />
    </Tabs>
  );
}
