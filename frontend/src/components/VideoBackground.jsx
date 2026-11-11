import { useState, useRef, useEffect } from 'react';

const VIDEOS = [
  '/videos/wed1.webm',
  '/videos/wed2.webm',
  '/videos/wed3.webm',
];

export default function VideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  const handleEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  return (
    <div className="hero-video-bg-container">
      <video
        ref={videoRef}
        key={VIDEOS[currentIndex]}
        className="hero-video-element"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
      >
        <source src={VIDEOS[currentIndex]} type="video/webm" />
      </video>

      {/* Elegant dark gradient overlay for text readability */}
      <div className="hero-video-overlay" />

      {/* Discrete video indicator pills */}
      <div className="hero-video-indicators">
        {VIDEOS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Play background video ${idx + 1}`}
            className={`hero-video-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}

