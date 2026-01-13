'use client';

import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Monitor, Scissors } from "lucide-react";

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
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunks.push(event.data);
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
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a192f] flex items-center justify-center p-4 text-white">

      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-transparent border border-[#64ffda] rounded-xl shadow-[0_0_20px_#64ffda]">

        <CardHeader>
          <CardTitle className="kode-mono text-center text-3xl">
            Screen Recorder
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!isRecording && !recordedBlob && (
            <div className="text-center space-y-4 flex flex-col items-center justify-center">
              <Button
                size="lg"
                onClick={startRecording}
                className="px-8 py-4 rounded-lg bg-[#17263a] border border-[#64ffda] text-aquamarine hover:shadow-[0_0_20px_#64ffda] transition-all flex items-center gap-2"
              >
                <Monitor className="w-5 h-5" /> <Mic className="w-5 h-5" />
                Start Recording
              </Button>

              <p className="text-aquamarine text-sm">
                Click to begin capturing your screen and audio
              </p>
            </div>
          )}

          {isRecording && (
            <div className="text-center space-y-6">
              <div className="flex justify-center items-center gap-3">
                <div className="w-3 h-3 bg-red-500 animate-ping rounded-full"></div>
                <span className="text-xl text-white">Recording...</span>
              </div>

              <Button
                size="lg"
                onClick={stopRecording}
                className="px-8 py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_red] transition-all"
              >
                Stop Recording
              </Button>
            </div>
          )}

          {recordedBlob && (
            <div className="space-y-8">
              <video
                src={URL.createObjectURL(recordedBlob)}
                controls
                className="w-full rounded-xl shadow-[0_0_10px_#64ffda] border border-[#64ffda]"
              />

              <Trimmer
                blob={recordedBlob}
                onTrimmed={async (trimmedBlob) => {
                  const formData = new FormData();
                  formData.append('video', trimmedBlob, 'video.webm');

                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });

                  const result = await response.json();
                  if (result.shareLink) {
                    alert(`Uploaded! Share link: ${window.location.origin}${result.shareLink}`);
                  } else {
                    alert('Upload failed');
                  }
                }}
              />

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Trimmer({ blob, onTrimmed }: { blob: Blob; onTrimmed: (b: Blob) => void }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (endTime === -1) setEndTime(dur);
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
        'output.webm',
      ]);

      const data = await ffmpeg.readFile('output.webm');
      const trimmedBlob = new Blob([data as any], { type: 'video/webm' });

      onTrimmed(trimmedBlob);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="space-y-6 text-aquamarine">

      <h3 className="text-xl font-semibold text-center flex items-center justify-center gap-2 text-aquamarine">
        <Scissors className="w-5 h-5 text-aquamarine" /> Trim Video
      </h3>

      <video
        ref={videoRef}
        src={URL.createObjectURL(blob)}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full rounded-xl border border-[#64ffda] shadow-[0_0_10px_#64ffda]"
      />

      <div className="flex justify-center gap-6">
        <div>
          <label className="text-sm text-aquamarine mb-1">Start (s)</label>
          <Input
            type="number"
            value={startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(Number(e.target.value))}
            min={0}
            max={duration}
            step="0.1"
            className="px-3 py-2 bg-[#0a192f] border border-[#64ffda] rounded-lg text-aquamarine"
          />
        </div>

        <div>
          <label className="text-sm text-aquamarine mb-1">End (s)</label>
          <Input
            type="number"
            value={endTime === -1 ? "" : endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(Number(e.target.value))}
            min={0}
            max={duration}
            step="0.1"
            className="px-3 py-2 bg-[#0a192f] border border-[#64ffda] rounded-lg text-aquamarine"
          />
        </div>
      </div>

      <div className="text-center flex justify-center text-black">
        <Button
          onClick={trimVideo}
          disabled={isTrimming}
          className="px-8 py-4 rounded-lg border bg-white border-[#64ffda] text-aquamarine hover:shadow-[0_0_20px_#64ffda] flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isTrimming && <Loader2 className="h-5 w-5 animate-spin" />}
          Trim and Export
        </Button>
      </div>
    </div>
  );
}

