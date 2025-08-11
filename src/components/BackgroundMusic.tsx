// =====================
// MEDIA PLAYER VERSION: 
// =====================
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useMusic } from "../context/MusicContext";
import { toast } from "react-hot-toast";
import { FaPlay } from "react-icons/fa";
import { toastDarkStyle, toastLightStyle, toastDarkStyleMobile, toastLightStyleMobile } from "./ToastStyle";
import MediaPlayerBox from "./MediaPlayer";
import "./MediaPlayer.css";

interface Track {
  name: string;
  src: string;
}

const BackgroundMusic: React.FC = () => {
  const tracks: Track[] = [
    {
      name: "ALONE IN LORDRAN - INTERWORLD X HOSPICEMANE",
      src: require("../assets/alone_in_lordran.mp3")
    },
    {
      name: "NUMB - INTERWORLD X DEVILISH TRIO",
      src: require("../assets/numb.mp3")
    },
    {
      name: "SATORU GODJO - NNX LXSY",
      src: require("../assets/satoru_godjo.mp3")
    }
  ];

  const audioRef = useRef<HTMLAudioElement>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerAnimating, setIsPlayerAnimating] = useState(false);
  const [loopMode, setLoopMode] = useState("queue");
  const [isRandom, setIsRandom] = useState(false);
  const [isStopped, setIsStopped] = useState(true);
  
  // Refs để track user interaction
  const hasPlayedOnce = useRef(false);
  const hasUserInteracted = useRef(false);
  
  const { isDarkMode } = useTheme();
  const { showMusicPlayer, setShowMusicPlayer, setIsPlaying: setGlobalIsPlaying } = useMusic();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync local isPlaying state với global state
  useEffect(() => {
    setGlobalIsPlaying(isPlaying);
  }, [isPlaying, setGlobalIsPlaying]);

  // Hàm đóng player với animation
  const closePlayerWithAnimation = useCallback(() => {
    if (showMusicPlayer) {
      setIsPlayerAnimating(true);
      setTimeout(() => {
        setShowMusicPlayer(false);
        setIsPlayerAnimating(false);
      }, 500);
    }
  }, [showMusicPlayer, setShowMusicPlayer]);

  // Effect để lắng nghe tương tác đầu tiên của user
  useEffect(() => {
    const handleFirstInteraction = (e: Event) => {
      // Nếu click vào player box, không xử lý ở đây
      if (playerBoxRef.current?.contains(e.target as Node)) {
        return;
      }

      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
        console.log('First user interaction detected');
        
        // Kích hoạt autoplay sau khi có tương tác
        if (!hasPlayedOnce.current && audioRef.current && isStopped) {
          setTimeout(() => {
            autoPlayFirstTrack();
          }, 500);
        }
      }
    };

    // Lắng nghe tất cả các loại tương tác
    const interactionEvents = [
      'click', 'mousedown', 'pointerdown',
      'touchend', 'keydown' // Loai bo 'mousemove' va 'wheel'
    ];

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { 
        passive: true 
      });
    });

    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, []);

  // Effect để xử lý click outside và ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showMusicPlayer &&
        playerBoxRef.current &&
        !playerBoxRef.current.contains(e.target as Node)
      ) {
        closePlayerWithAnimation();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMusicPlayer) {
        closePlayerWithAnimation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMusicPlayer, closePlayerWithAnimation]);

  // Function để auto-play track đầu tiên
  const autoPlayFirstTrack = async () => {
    if (!hasPlayedOnce.current && audioRef.current && isStopped) {
      try {
        console.log('Auto-playing first track after user interaction');
        audioRef.current.volume = 0.5;
        const randomIndex = Math.floor(Math.random() * tracks.length);
        setCurrentTrackIndex(randomIndex);
        audioRef.current.src = tracks[randomIndex].src;
        audioRef.current.load();
        
        // Wait for audio to be ready
        await new Promise<void>((resolve) => {
          if (audioRef.current) {
            const handleCanPlay = () => resolve();
            audioRef.current.addEventListener('canplaythrough', handleCanPlay, { once: true });
          }
        });

        // Attempt to play
        await audioRef.current.play();
        
        setIsPlaying(true);
        setIsStopped(false);
        hasPlayedOnce.current = true;
        
        showToast(`Playing: ${tracks[randomIndex].name}`, React.createElement(FaPlay as any, { style: { color: "#10b981" } }));
        
      } catch (error) {
        console.error("Autoplay failed:", error);
        
        // Fallback: Show toast để user biết có thể click để phát nhạc
        showToast('Click Music button to start playing', React.createElement(FaPlay as any, { style: { color: "#10b981" } }));
      }
    }
  };

  const showToast = (msg: string, icon?: any) => {
    toast(msg, {
      icon,
      duration: 4000,
      style: isMobile 
        ? (isDarkMode ? toastDarkStyleMobile : toastLightStyleMobile)
        : (isDarkMode ? toastDarkStyle : toastLightStyle)
    });
  };

  const playRandomTrack = () => {
    // Tạo danh sách các index có thể chọn (loại trừ bài hiện tại)
    const availableIndices = tracks
      .map((_, index) => index)
      .filter(index => index !== currentTrackIndex);
    
    // Nếu chỉ có 1 bài hoặc không có bài nào khác, thì chọn bài đó
    if (availableIndices.length === 0) {
      changeTrackFromParent(currentTrackIndex);
    } else {
      // Random từ danh sách đã loại trừ bài hiện tại
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const selectedIndex = availableIndices[randomIndex];
      changeTrackFromParent(selectedIndex);
    }
  };

  const playNextTrack = () => {
    if (!audioRef.current) return;
    
    if (isRandom) {
      playRandomTrack();
    } else {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      changeTrackFromParent(nextIndex);
    }
  };

  const changeTrackFromParent = async (index: number) => {
    try {
      console.log('Changing track to:', tracks[index].name);
      
      // Dừng audio hiện tại
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Đợi một chút
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Cập nhật track index trước
      setCurrentTrackIndex(index);
      
      // Thiết lập source mới
      if (audioRef.current) {
        audioRef.current.src = tracks[index].src;
        
        // Tải và phát nhạc
        audioRef.current.load();
        
        // Đảm bảo autoplay
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Track played successfully');
          
          setIsPlaying(true);
          setIsStopped(false);
          showToast(`Playing: ${tracks[index].name}`, React.createElement(FaPlay as any, { style: { color: "#10b981" } }));
        }
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
            showToast(`Playing: ${tracks[index].name}`, React.createElement(FaPlay as any, { style: { color: "#10b981" } }));
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 200);
    }
  };

  return (
    <div className="music-container">
      <audio
        ref={audioRef}
        src={currentTrack.src}
        loop={loopMode === "track"}
        onEnded={() => {
          if (loopMode === "queue") {
            playNextTrack();
          }
        }}
        preload="metadata"
      />

      {(showMusicPlayer || isPlayerAnimating) && (
        <div ref={playerBoxRef}>
          <MediaPlayerBox
            audioRef={audioRef}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            setCurrentTrackIndex={setCurrentTrackIndex}
            loopMode={loopMode}
            setLoopMode={setLoopMode}
            isRandom={isRandom}
            setIsRandom={setIsRandom}
            setShowPlayerBox={setShowMusicPlayer}
            showToast={showToast}
            isStopped={isStopped}
            setIsStopped={setIsStopped}
            changeTrackFromParent={changeTrackFromParent}
            isAnimating={isPlayerAnimating}
            className={showMusicPlayer && !isPlayerAnimating ? 'show' : ''}
          />
        </div>
      )}
    </div>
  );
};

export default BackgroundMusic;
