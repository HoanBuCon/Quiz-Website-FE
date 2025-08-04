// =====================
// MEDIA PLAYER VERSION: 
// =====================
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";
import { FaMusic, FaPlay, FaPause } from "react-icons/fa";
import { toastDarkStyle, toastLightStyle, toastDarkStyleMobile, toastLightStyleMobile } from "./ToastStyle";
import MediaPlayerBox from "./MediaPlayer";
import "./MediaPlayer.css";

const BackgroundMusic = () => {
  const tracks = [
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

  const audioRef = useRef(null);
  const musicButtonRef = useRef(null);
  const playerBoxRef = useRef(null);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayerBox, setShowPlayerBox] = useState(false);
  const [isPlayerAnimating, setIsPlayerAnimating] = useState(false);
  const [loopMode, setLoopMode] = useState("queue");
  const [isRandom, setIsRandom] = useState(false);
  const [isStopped, setIsStopped] = useState(true);
  
  // Refs để track user interaction
  const hasPlayedOnce = useRef(false);
  const hasUserInteracted = useRef(false);
  
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hàm đóng player với animation
  const closePlayerWithAnimation = useCallback(() => {
    if (showPlayerBox) {
      setIsPlayerAnimating(true);
      setTimeout(() => {
        setShowPlayerBox(false);
        setIsPlayerAnimating(false);
      }, 500);
    }
  }, [showPlayerBox]);

  // Effect để lắng nghe tương tác đầu tiên của user (KHÔNG bao gồm click vào Music button)
  useEffect(() => {
    const handleFirstInteraction = (e) => {
      // Nếu click vào Music button hoặc player box, không xử lý ở đây
      if (musicButtonRef.current?.contains(e.target) || 
          playerBoxRef.current?.contains(e.target)) {
        return;
      }

      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
        console.log('First user interaction detected (non-music button)');
        
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
      'touchend', 'keydown', 'wheel', 'mousemove'
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
    const handleClickOutside = (e) => {
      console.log('Click outside detected:', e.target);
      console.log('showPlayerBox:', showPlayerBox);
      console.log('playerBoxRef.current:', playerBoxRef.current);
      console.log('musicButtonRef.current:', musicButtonRef.current);
      
      if (
        showPlayerBox &&
        playerBoxRef.current &&
        !playerBoxRef.current.contains(e.target) &&
        !musicButtonRef.current.contains(e.target)
      ) {
        console.log('Closing player via click outside');
        closePlayerWithAnimation();
      }
    };

    const handleEsc = (e) => {
      console.log('ESC pressed, showPlayerBox:', showPlayerBox);
      if (e.key === 'Escape' && showPlayerBox) {
        console.log('Closing player via ESC');
        closePlayerWithAnimation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showPlayerBox, closePlayerWithAnimation]); // Thêm showPlayerBox và closePlayerWithAnimation vào dependency array

// Effect riêng để xử lý ESC key
useEffect(() => {
  const handleEscKey = (e) => {
    if (e.key === 'Escape' && showPlayerBox) {
      console.log('ESC key detected, closing player');
      closePlayerWithAnimation();
    }
  };

  window.addEventListener('keydown', handleEscKey);
  
  return () => {
    window.removeEventListener('keydown', handleEscKey);
  };
}, [showPlayerBox, closePlayerWithAnimation]);

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
        await new Promise((resolve) => {
          audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
        });

        // Attempt to play
        await audioRef.current.play();
        
        setIsPlaying(true);
        setIsStopped(false);
        hasPlayedOnce.current = true;
        
        showToast(`Playing: ${tracks[randomIndex].name}`, <FaPlay style={{ color: '#27ae60' }} />);
        
      } catch (error) {
        console.error("Autoplay failed:", error);
        
        // Fallback: Show toast để user biết có thể click để phát nhạc
        showToast('Click Music button to start playing', <FaMusic style={{ color: '#3498db' }} />);
      }
    }
  };

  const showToast = (msg, icon) => {
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

  const handleMusicClick = async () => {
    if (!audioRef.current) return;
    
    // Đánh dấu user đã tương tác
    if (!hasUserInteracted.current) {
      hasUserInteracted.current = true;
      console.log('First user interaction via Music button');
    }
    
    if (showPlayerBox) {
      closePlayerWithAnimation();
    } else {
      setShowPlayerBox(true);
      
      // FIX: Nếu chưa có nhạc nào được phát và đây là lần đầu tương tác
      // thì tự động phát nhạc
      if (isStopped && !hasPlayedOnce.current) {
        try {
          console.log('Auto-playing first track via Music button click');
          audioRef.current.volume = 0.5;
          const randomIndex = Math.floor(Math.random() * tracks.length);
          setCurrentTrackIndex(randomIndex);
          audioRef.current.src = tracks[randomIndex].src;
          audioRef.current.load();
          
          // Wait for audio to be ready
          await new Promise((resolve) => {
            audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
          });

          // Attempt to play
          await audioRef.current.play();
          
          setIsPlaying(true);
          setIsStopped(false);
          hasPlayedOnce.current = true;
          
          showToast(`Playing: ${tracks[randomIndex].name}`, <FaPlay style={{ color: '#27ae60' }} />);
          
        } catch (error) {
          console.error("Autoplay via Music button failed:", error);
          
          // Nếu autoplay thất bại, chỉ load nhạc sẵn sàng để user có thể play manual
          const randomIndex = Math.floor(Math.random() * tracks.length);
          setCurrentTrackIndex(randomIndex);
          audioRef.current.src = tracks[randomIndex].src;
          audioRef.current.load();
          hasPlayedOnce.current = true;
          
          showToast('Music loaded, click Play to start', <FaMusic style={{ color: '#3498db' }} />);
        }
      }
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

  const changeTrackFromParent = async (index) => {
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
        showToast(`Playing: ${tracks[index].name}`, <FaPlay style={{ color: '#27ae60' }} />);
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
            showToast(`Playing: ${tracks[index].name}`, <FaPlay style={{ color: '#27ae60' }} />);
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

      <button
        ref={musicButtonRef}
        onClick={handleMusicClick}
        className={`effect-btn music-btn${isPlaying ? " active" : ""}`}
        title="Music"
        style={{ userSelect: "none", cursor: "pointer", zIndex: 1000 }}
      >
        <FaMusic className="effect-icon" />
        <span className="effect-text">Music</span>
      </button>

      {(showPlayerBox || isPlayerAnimating) && (
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
            setShowPlayerBox={setShowPlayerBox}
            showToast={showToast}
            isStopped={isStopped}
            setIsStopped={setIsStopped}
            changeTrackFromParent={changeTrackFromParent}
            isAnimating={isPlayerAnimating}
            className={showPlayerBox && !isPlayerAnimating ? 'show' : ''}
          />
        </div>
      )}
    </div>
  );
};

export default BackgroundMusic;