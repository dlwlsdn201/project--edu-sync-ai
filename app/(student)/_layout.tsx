import { Tabs } from 'expo-router';
import { BookOpen, Plus } from 'lucide-react-native';

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
      <Tabs.Screen
        name="join"
        options={{
          title: '수업 참여',
          tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{ href: null }}
      />
    </Tabs>
  );
}
