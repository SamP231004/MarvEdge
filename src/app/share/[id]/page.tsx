'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const { id } = useParams() as { id: string };
  const [video, setVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch video data
    fetch(`/api/video/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setVideo(data);
          // Track view
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: id, event: 'view' }),
          });
        }
      })
      .catch(err => setError('Failed to load video'));
  }, [id]);

  if (error) return <div className="p-8">Error: {error}</div>;
  if (!video) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      <video
        src={video.file}
        controls
        className="w-full max-w-4xl"
      />
      <p className="mt-4">Views: {video.views || 0}</p>
    </div>
  );
}