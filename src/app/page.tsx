import Recorder from '../components/Recorder';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Screen Recording MVP</h1>
      <Recorder />
    </div>
  );
}
