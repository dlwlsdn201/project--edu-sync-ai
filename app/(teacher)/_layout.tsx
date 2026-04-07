import { Tabs } from 'expo-router';
import { PlusCircle, BookOpen } from 'lucide-react-native';

export default function TeacherLayout() {
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
        name="quiz-create"
        options={{
          title: '퀴즈 생성',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz-library"
        options={{
          title: '퀴즈 목록',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
