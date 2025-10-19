export default function BackgroundVideo() {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/bg-loop.mp4" type="video/mp4" />
      </video>
    );
  }