"use client";
import { useRef, useState } from "react";
import { CreatorProfile, TopPost } from "@/lib/drupal";

interface MySpaceThemeProps {
  profile: CreatorProfile;
  backgroundUrl?: string;
  musicUrl?: string;
  glitterColor?: string;
  accentColor?: string;
}

export default function MySpaceTheme({
  profile,
  backgroundUrl,
  musicUrl,
  glitterColor = "#ff00ff",
  accentColor = "#00ffff",
}: MySpaceThemeProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className="min-h-screen overflow-hidden font-mono text-white"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        backgroundColor: backgroundUrl ? undefined : "#000033",
      }}
    >
      {/* Glitter keyframes */}
      <style>{`
        @keyframes glitter {
          0%, 100% { text-shadow: 0 0 10px ${glitterColor}, 0 0 20px ${glitterColor}, 0 0 40px ${glitterColor}; }
          50% { text-shadow: 0 0 5px ${accentColor}, 0 0 15px ${accentColor}, 0 0 30px ${accentColor}; }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Top Bar - Classic MySpace Blue */}
      <div className="overflow-hidden bg-[#000080] py-2 border-b-4 border-white">
        <div
          className="whitespace-nowrap text-xl font-bold"
          style={{
            color: glitterColor,
            animation: "marquee 12s linear infinite",
          }}
        >
          &#9733; {profile.title}&apos;s RAREIMAGERY STORE &#9733; POWERED BY
          GROK AI &#9733;
        </div>
      </div>

      {/* Hero - PFP + Name */}
      <div
        className="relative py-12 text-center"
        style={{ borderBottom: `8px solid ${glitterColor}` }}
      >
        {profile.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt={profile.x_username}
            className="mx-auto h-48 w-48 object-cover"
            style={{
              border: `8px solid ${accentColor}`,
              filter: `drop-shadow(0 0 20px ${glitterColor})`,
            }}
          />
        ) : (
          <div
            className="mx-auto flex h-48 w-48 items-center justify-center text-6xl font-bold"
            style={{
              border: `8px solid ${accentColor}`,
              backgroundColor: "#000",
              color: glitterColor,
            }}
          >
            {profile.x_username.charAt(0).toUpperCase()}
          </div>
        )}

        <h1
          className="mt-6 text-5xl font-extrabold tracking-widest sm:text-6xl"
          style={{ animation: "glitter 1s infinite" }}
        >
          {profile.title}&apos;s STORE
        </h1>

        <p className="mx-auto mt-3 text-lg" style={{ color: accentColor }}>
          @{profile.x_username} &middot;{" "}
          {profile.follower_count.toLocaleString()} followers
        </p>

        {musicUrl && (
          <button
            onClick={toggleMusic}
            className="mt-4 px-8 py-3 font-bold transition hover:scale-110"
            style={{
              backgroundColor: "#000",
              border: `4px solid ${accentColor}`,
              color: accentColor,
            }}
          >
            {isPlaying
              ? "\u23F8 STOP THE BANGERS"
              : "\u25B6 PLAY MYSPACE SONG"}
          </button>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div
          className="mx-auto max-w-3xl px-6 py-8"
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            border: `4px solid ${glitterColor}`,
            margin: "20px auto",
          }}
        >
          <h2
            className="mb-3 text-2xl font-bold"
            style={{ color: glitterColor }}
          >
            ABOUT ME
          </h2>
          <div
            className="leading-relaxed text-zinc-300"
            dangerouslySetInnerHTML={{ __html: profile.bio }}
          />
        </div>
      )}

      {/* Top 8 Posts */}
      {profile.top_posts.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2
            className="mb-8 text-center text-4xl font-bold"
            style={{ color: glitterColor, textShadow: "3px 3px #000" }}
          >
            MY TOP 8 POSTS
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {profile.top_posts.slice(0, 8).map((post: TopPost, i: number) => (
              <div
                key={post.id || i}
                className="bg-black p-4 text-center transition-transform hover:rotate-1"
                style={{
                  border: `6px solid ${accentColor}`,
                  boxShadow: `0 0 20px ${glitterColor}`,
                }}
              >
                <p className="line-clamp-4 text-sm text-zinc-300">
                  {post.text}
                </p>
                <div
                  className="mt-3 text-xs"
                  style={{ color: glitterColor }}
                >
                  {post.likes.toLocaleString()} likes &middot;{" "}
                  {post.retweets.toLocaleString()} RTs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 8 Followers */}
      {profile.top_followers.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2
            className="mb-8 text-center text-4xl font-bold"
            style={{ color: accentColor, textShadow: "3px 3px #000" }}
          >
            MY TOP 8 FRIENDS
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {profile.top_followers.slice(0, 8).map((f, i) => (
              <div
                key={f.username || i}
                className="bg-black p-3 text-center"
                style={{ border: `4px solid ${glitterColor}` }}
              >
                {f.profile_image_url ? (
                  <img
                    src={f.profile_image_url}
                    alt={f.username}
                    className="mx-auto h-16 w-16 object-cover"
                    style={{ border: `3px solid ${accentColor}` }}
                  />
                ) : (
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center font-bold"
                    style={{
                      border: `3px solid ${accentColor}`,
                      backgroundColor: "#111",
                      color: glitterColor,
                    }}
                  >
                    {f.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="mt-2 truncate text-sm font-bold" style={{ color: accentColor }}>
                  @{f.username}
                </p>
                <p className="text-xs text-zinc-500">
                  {f.follower_count.toLocaleString()} followers
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grok Marquee */}
      <div className="overflow-hidden bg-black py-4">
        <div
          className="whitespace-nowrap text-2xl font-bold"
          style={{
            color: accentColor,
            animation: "marquee 15s linear infinite",
          }}
        >
          GROK SAYS: This creator is FIRE -- Follow @{profile.x_username} and
          check out their store at {profile.x_username}.rareimagery.net
        </div>
      </div>

      {/* Footer */}
      <div
        className="py-6 text-center text-sm"
        style={{ backgroundColor: "rgba(0,0,0,0.9)", color: glitterColor }}
      >
        Powered by RareImagery X Marketplace &middot; MySpace Theme &middot;
        Grok AI
      </div>

      {/* Hidden audio player */}
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop />}
    </div>
  );
}
