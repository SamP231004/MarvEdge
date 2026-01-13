'use client';

import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...micStream.getAudioTracks(),
      ]);

      streamRef.current = combinedStream;
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">Screen Recorder</h2>
        
        {!isRecording && !recordedBlob && (
          <div className="text-center">
            <button
              onClick={startRecording}
              className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Start Recording
            </button>
            <p className="text-gray-500 mt-4 text-sm">Click to begin screen recording</p>
          </div>
        )}
        
        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-gray-700 font-medium">Recording...</span>
            </div>
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-8 py-3 rounded-full hover:bg-red-600 transition-colors duration-200 font-medium"
            >
              Stop Recording
            </button>
          </div>
        )}
        
        {recordedBlob && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-light text-gray-900 mb-4">Recorded Video</h3>
              <video
                src={URL.createObjectURL(recordedBlob)}
                controls
                className="w-full rounded-lg shadow-sm"
              />
            </div>
            <Trimmer 
              blob={recordedBlob} 
              onTrimmed={async (trimmedBlob) => {
                // Upload the trimmed video
                const formData = new FormData();
                formData.append('video', trimmedBlob, 'video.webm');
                const response = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                });
                const result = await response.json();
                if (result.shareLink) {
                  alert(`Video uploaded! Share link: ${window.location.origin}${result.shareLink}`);
                } else {
                  alert('Upload failed');
                }
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Trimmer({ blob, onTrimmed }: { blob: Blob; onTrimmed: (blob: Blob) => void }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(-1); // -1 means not set
  const [duration, setDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (endTime === -1) {
        setEndTime(dur);
      }
    }
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm',
    });
    return ffmpeg;
  };

  const trimVideo = async () => {
    setIsTrimming(true);
    try {
      const ffmpeg = await loadFFmpeg();
      await ffmpeg.writeFile('input.webm', await fetchFile(blob));
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-ss', startTime.toString(),
        '-t', (endTime - startTime).toString(),
        '-c', 'copy',
        'output.webm'
      ]);
      const data = await ffmpeg.readFile('output.webm');
      const trimmedBlob = new Blob([data as any], { type: 'video/webm' });
      onTrimmed(trimmedBlob);
    } catch (error) {
      console.error('Error trimming video:', error);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-light text-gray-900 text-center">Trim Video</h3>
      <video
        ref={videoRef}
        src={URL.createObjectURL(blob)}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full rounded-lg shadow-sm"
      />
      <div className="flex space-x-4 justify-center">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Start Time (s)</label>
          <input 
            type="number" 
            value={startTime} 
            onChange={(e) => setStartTime(Number(e.target.value))} 
            min={0} 
            max={duration} 
            step="0.1"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">End Time (s)</label>
          <input 
            type="number" 
            value={endTime === -1 ? '' : endTime} 
            onChange={(e) => setEndTime(Number(e.target.value))} 
            min={0} 
            max={duration} 
            step="0.1"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>
      <div className="text-center">
        <button 
          onClick={trimVideo} 
          disabled={isTrimming} 
          className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 font-medium disabled:opacity-50"
        >
          {isTrimming ? 'Trimming...' : 'Trim and Export'}
        </button>
      </div>
    </div>
  );
}