import React, { useState, useEffect } from "react";
import {
  FaStepBackward,
  FaStepForward,
  FaPause,
  FaPlay,
  FaRandom,
  FaStop,
  FaSync,
} from "react-icons/fa";
import "./MediaPlayer.css";

interface Track {
  name: string;
  src: string;
}

interface MediaPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTrack: Track;
  tracks: Track[];
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  loopMode: string;
  setLoopMode: (mode: string) => void;
  isRandom: boolean;
  setIsRandom: (random: boolean) => void;
  setShowPlayerBox: (show: boolean) => void;
  showToast: (msg: string, icon?: any) => void;
  isStopped: boolean;
  setIsStopped: (stopped: boolean) => void;
  changeTrackFromParent?: (index: number) => void;
  isAnimating: boolean;
  className?: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  audioRef,
  isPlaying,
  setIsPlaying,
  currentTrack,
  tracks,
  currentTrackIndex,
  setCurrentTrackIndex,
  loopMode,
  setLoopMode,
  isRandom,
  setIsRandom,
  setShowPlayerBox,
  showToast,
  isStopped,
  setIsStopped,
  changeTrackFromParent,
  isAnimating,
  className,
}) => {
  const [showLoopOptions, setShowLoopOptions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && !isChangingTrack) {
        const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(value) ? 0 : value);
        setCurrentTime(audioRef.current.currentTime || 0);
        setDuration(audioRef.current.duration || 0);
      }
    };
    const interval = setInterval(updateProgress, 500);
    return () => clearInterval(interval);
  }, [audioRef, isChangingTrack]);

  // FIX: Sửa lại nút Pause để không tắt media player - thêm stopPropagation
  const togglePlayPause = (e: React.MouseEvent) => {
    // Ngăn event bubbling
    e.stopPropagation();
    e.preventDefault();
    
    if (!audioRef.current) return;
    
    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        showToast("Paused", React.createElement(FaPause as any, { style: { color: "#f39c12" } }));
    } else {
        audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsStopped(false);
        showToast(`Playing: ${currentTrack.name}`, React.createElement(FaPlay as any, { style: { color: "#27ae60" } }));
        }).catch(console.error);
    }
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsStopped(true);
    setShowPlayerBox(false);
    showToast("Stopped", React.createElement(FaStop as any, { style: { color: "#e74c3c" } }));
  };

  const changeTrack = async (index: number) => {
    if (!audioRef.current || isChangingTrack) return;

    setIsChangingTrack(true);
    
    try {
      console.log('Local change track to:', tracks[index].name);
      
      // Dừng audio hiện tại
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Đợi một chút
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Cập nhật track index trước
      setCurrentTrackIndex(index);
      
      // Thiết lập source mới
      audioRef.current.src = tracks[index].src;
      
      // Load và play
      audioRef.current.load();
      
      // Đảm bảo autoplay
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Track played successfully');
        
        setIsPlaying(true);
        setIsStopped(false);
        showToast(`Playing: ${tracks[index].name}`, React.createElement(FaPlay as any, { style: { color: "#27ae60" } }));
      }
      
    } catch (error) {
      console.error("Failed to change track:", error);
      
      // Retry mechanism
      setTimeout(async () => {
        try {
          if (audioRef.current) {
            await audioRef.current.play();
            setIsPlaying(true);
            setIsStopped(false);
            showToast(`Playing: ${tracks[index].name}`, React.createElement(FaPlay as any, { style: { color: "#27ae60" } }));
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 200);
    } finally {
      setIsChangingTrack(false);
    }
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isChangingTrack) return;
    
    let nextIndex;
    if (isRandom) {
      // Tạo danh sách các index có thể chọn (loại trừ bài hiện tại)
      const availableIndices = tracks
        .map((_, index) => index)
        .filter(index => index !== currentTrackIndex);
      
      // Nếu chỉ có 1 bài, thì chọn bài đó
      if (availableIndices.length === 0) {
        nextIndex = currentTrackIndex;
      } else {
        // Random từ danh sách đã loại trừ bài hiện tại
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        nextIndex = availableIndices[randomIndex];
      }
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    
    // Sử dụng changeTrackFromParent nếu có, nếu không thì dùng changeTrack local
    if (changeTrackFromParent) {
      changeTrackFromParent(nextIndex);
    } else {
      changeTrack(nextIndex);
    }
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isChangingTrack) return;
    
    let prevIndex;
    if (isRandom) {
      // Tạo danh sách các index có thể chọn (loại trừ bài hiện tại)
      const availableIndices = tracks
        .map((_, index) => index)
        .filter(index => index !== currentTrackIndex);
      
      // Nếu chỉ có 1 bài, thì chọn bài đó
      if (availableIndices.length === 0) {
        prevIndex = currentTrackIndex;
      } else {
        // Random từ danh sách đã loại trừ bài hiện tại
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        prevIndex = availableIndices[randomIndex];
      }
    } else {
      prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    }
    
    // Sử dụng changeTrackFromParent nếu có, nếu không thì dùng changeTrack local
    if (changeTrackFromParent) {
      changeTrackFromParent(prevIndex);
    } else {
      changeTrack(prevIndex);
    }
  };

  const toggleRandom = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newRandomState = !isRandom;
    setIsRandom(newRandomState);
    showToast(newRandomState ? "Random ON" : "Random OFF", React.createElement(FaRandom as any));
  };

  const handleLoopModeChange = (mode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setLoopMode(mode);
    setShowLoopOptions(false);
    
    // Cập nhật thuộc tính loop của audio element
    if (audioRef.current) {
      audioRef.current.loop = mode === "track";
    }
    
    showToast(`Loop mode: ${mode === "track" ? "Track" : "Queue"}`, React.createElement(FaSync as any));
  };

  const toggleLoopOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setShowLoopOptions((prev) => !prev);
  };

  const seekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (!audioRef.current || isChangingTrack) return;
    const percent = Number(e.target.value);
    const newTime = (percent / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(percent);
  };

  // Hàm formatTime chuyển giây thành mm:ss
  function formatTime(time: number): string {
    if (isNaN(time) || time === Infinity) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // FIX: Thêm handler để ngăn click bubbling cho toàn bộ media player
  const handlePlayerClick = (e: React.MouseEvent) => {
    // Chỉ ngăn propagation nếu click vào các nút hoặc timeline
    if (e.target instanceof HTMLElement && (e.target.tagName === 'BUTTON' || (e.target as HTMLInputElement).type === 'range')) {
      e.stopPropagation();
    }
  };

  return (
    <div className={`media-player-box ${isAnimating ? 'slide-out' : ''} ${className || ''}`} onClick={handlePlayerClick}>
      <div className="track-name">{currentTrack.name}</div>
      <div className="timeline-container">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={seekAudio}
          className="timeline-slider"
          disabled={isChangingTrack}
        />
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="controls">
        <button onClick={prev} title="Previous" disabled={isChangingTrack}>
          {React.createElement(FaStepBackward as any)}
        </button>
        <button onClick={togglePlayPause} title="Pause / Continue">
          {isPlaying ? React.createElement(FaPause as any) : React.createElement(FaPlay as any)}
        </button>
        <button onClick={next} title="Next" disabled={isChangingTrack}>
          {React.createElement(FaStepForward as any)}
        </button>
      </div>
      <div className="options">
        <button
          onClick={toggleRandom}
          className={isRandom ? "active" : ""}
          title="Toggle Random"
        >
          {React.createElement(FaRandom as any)}
        </button>
        <button onClick={stop} title="Stop">
          {React.createElement(FaStop as any)}
        </button>
        <div className="loop-container">
          <button
            onClick={toggleLoopOptions}
            className={`loop-btn${loopMode === "track" ? " active" : ""}`}
            title="Loop Options"
            hidden={showLoopOptions}
          >
            {React.createElement(FaSync as any)}
          </button>
          {showLoopOptions && (
            <div className="loop-options">
              <button
                className={loopMode === "queue" ? "active" : ""}
                onClick={(e) => handleLoopModeChange("queue", e)}
              >
                Loop Queue
              </button>
              <button
                className={loopMode === "track" ? "active" : ""}
                onClick={(e) => handleLoopModeChange("track", e)}
              >
                Loop Track
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
