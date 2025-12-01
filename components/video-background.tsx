import React from 'react';

interface VideoBackgroundProps {
  src: string;
  type: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ src, type }) => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-gold-900/20"></div>
    </div>
  );
};

export default VideoBackground;