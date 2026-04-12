import { Redirect } from 'expo-router';

/**
 * 예전 URL/북마크 호환: 수업 참여 화면은 퀴즈 탭으로 통합됨.
 */
export default function JoinRedirectScreen() {
  return <Redirect href="/(student)/quiz-list" />;
}
