// src/pages/MaintenancePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MAINTENANCE_MESSAGE, MAINTENANCE_VIDEO_URL } from '../utils/maintenanceConfig';

const MaintenancePage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }

    setIsPlaying(true);
    setIsLoading(true);

    // Fake progress 0 → 100 trong 5s
    let current = 0;
    const interval = setInterval(() => {
      current += 2; // mỗi bước tăng 2%
      if (current > 100) current = 100;
      setProgress(current);

      if (current === 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    }, 100); // 100ms * 50 = 5s
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    // Preload video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        loop
        playsInline
        preload="auto"
      >
        <source src={MAINTENANCE_VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div
        className={`absolute inset-0 transition-all duration-700
          ${isPlaying ? "bg-black/20" : "bg-black/40"}
        `}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {isLoading ? (
          /* ============================
            🔥 Loading 0–100% trong 5 giây
            ============================ */
          <div className="text-center animate-fadeIn flex flex-col items-center">
            <p className="text-xl text-gray-300 mb-4 font-mono">
              Loading...
            </p>

            {/* Progress bar */}
            <div className="w-64 h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-md border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-400 mt-3 font-mono">
              {progress}%
            </p>
          </div>
        ) : !isPlaying ? (
          // ============================
          //   MÀN HÌNH TRƯỚC KHI PLAY
          // ============================
          <div className="text-center animate-fadeIn flex flex-col items-center">
            {/* ===== Logo + Brand (RIÊNG) ===== */}
            <div className="mb-6 flex flex-col items-center">
              <img
                src={MAINTENANCE_MESSAGE.brand.logo}
                alt={MAINTENANCE_MESSAGE.brand.text + " Logo"}
                className="w-20 h-20 object-contain mb-4"
              />
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold logo-text text-white dark:text-primary-300">
                {MAINTENANCE_MESSAGE.brand.text}
              </span>
            </div>

            {/* ===== Nút Play (RIÊNG) ===== */}
            <div className="mt-6">
              <button
                onClick={handlePlayVideo}
                className="group relative inline-flex items-center gap-4 
                          px-3 py-3 rounded-xl
                          bg-white/10 backdrop-blur-xl border border-white/20
                          shadow-[0_0_25px_rgba(255,200,100,0.18)]
                          hover:shadow-[0_0_35px_rgba(255,200,150,0.28)]
                          transition-all duration-300 active:scale-95
                          text-white font-semibold text-xl
                          select-none overflow-hidden w-auto"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full
                            bg-gradient-to-br from-orange-500 to-amber-400
                            shadow-lg transition-transform duration-300 
                            relative z-10 group-hover:scale-110"
                >
                  <svg
                    className="w-6 h-6 text-white translate-x-[1px]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                  </svg>
                </div>

                <span className="tracking-wide text-lg font-mono relative z-10">
                  Liếm luôn
                </span>

                <div
                  className="absolute inset-0 rounded-full pointer-events-none
                            bg-gradient-to-r from-transparent via-white/30 to-transparent
                            -translate-x-full group-hover:translate-x-full
                            transition-transform duration-700"
                  style={{ zIndex: 1 }}
                />
              </button>
            </div>
          </div>
        ) : (
          // Maintenance Message with Video Playing
          <div className="text-center animate-slideUp">
            {/* Logo liemdai thay cho icon loading – KHÔNG có vòng tròn nền */}
            <div className="flex flex-col items-center justify-center mb-8">

              {/* Logo Trollface */}
              <img
                src={MAINTENANCE_MESSAGE.brand.logo}
                alt={MAINTENANCE_MESSAGE.brand.text + " Logo"}
                className="w-20 h-20 object-contain mb-4"
              />

              <span className="text-5xl sm:text-6xl lg:text-7xl font-bold logo-text text-white dark:text-primary-300">
                {MAINTENANCE_MESSAGE.brand.text}
              </span>
            </div>
            <div className="mb-8 space-y-3">
              <p className="text-2xl font-semibold text-yellow-500 mb-2">
                {MAINTENANCE_MESSAGE.content.title}
              </p>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {MAINTENANCE_MESSAGE.content.description}
              </p>
              <p className="text-md text-gray-400 italic">
                {MAINTENANCE_MESSAGE.content.estimatedTime}
              </p>
            </div>

            {/* Loading Animation */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div
                className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>

            {/* Contact Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-400 mb-2">
                Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ:
              </p>
              <a
                href="http://hoanbucon.id.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                hoanbucon.id.vn
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenancePage;