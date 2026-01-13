# Screen Recording MVP

A Next.js application for browser-based screen recording with trimming, uploading, and sharing capabilities.

## Features

- Record screen + microphone using MediaRecorder API
- Trim video start and end times using ffmpeg.wasm
- Upload trimmed videos to local storage
- Generate public share links
- Basic analytics (view counts)
- Clean UI with Tailwind CSS

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

1. Click "Start Recording" to begin screen recording with mic.
2. Click "Stop Recording" when done.
3. Adjust trim start/end times and click "Trim and Export".
4. The video will be uploaded and a share link will be provided.
5. Share the link to view the video publicly.

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- ffmpeg.wasm for video processing
- File-based storage (mocked)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
