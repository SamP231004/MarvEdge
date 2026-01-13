'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const { id } = useParams() as { id: string };
  const [video, setVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/video/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } 
        else {
          setVideo(data);
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: id, event: 'view' }),
          });
        }
      })
      .catch(() => setError('Failed to load video'));
  }, [id]);

  if (error)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a192f] text-red-400 kode-mono text-xl">
        Error: {error}
      </div>
    );

  if (!video)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a192f] text-aquamarine kode-mono text-xl">
        Loading...
      </div>
    );

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#64ffda] shadow-[0_0_20px_#64ffda] rounded-xl p-6 text-aquamarine kode-mono">
        <h1 className="text-3xl mb-6 text-center text-aquamarine">{video.title}</h1>
        <video
          src={video.file}
          controls
          className="w-full rounded-xl border border-black"
        />
        <p className="mt-4 text-center text-lg">
          Views: <span>{video.views || 0}</span>
        </p>
      </div>
    </div>
  );
}