import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh will reload the page
export default function App() {
  const ctx = (require as any).context('./src/app');
  return <ExpoRoot context={ctx} />;
}
