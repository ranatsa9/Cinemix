"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useExperienceStore } from "@/lib/store/useExperienceStore";

type PlatformName =
  | "Netflix"
  | "Prime Video"
  | "Apple TV"
  | "Disney+";

type Platform = {
  name: PlatformName;
  searchUrl: (title: string) => string;
};

const PLATFORMS: Platform[] = [
  {
    name: "Netflix",
    searchUrl: (title) =>
      `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },

  {
    name: "Prime Video",
    searchUrl: (title) =>
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(
        title
      )}`,
  },

  {
    name: "Apple TV",
    searchUrl: (title) =>
      `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },

  {
    name: "Disney+",
    searchUrl: (title) =>
      `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  },
];


/* =========================================================
   NETFLIX
========================================================= */

function NetflixLogo() {
  return (
    <div className="flex items-center gap-4">

      <motion.div
        whileHover={{
          scale: 1.12,
          rotate: -3,
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 16,
        }}
        className="relative flex h-12 w-10 items-center justify-center"
      >

        <span className="relative z-10 font-sans text-4xl font-black leading-none text-[#e50914]">
          N
        </span>

        <motion.div
          className="absolute inset-0 rounded-xl bg-[#e50914]/20 blur-xl"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

      </motion.div>


      <div className="text-left">

        <p className="text-lg font-semibold tracking-[0.08em] text-porcelain">
          NETFLIX
        </p>

        <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-porcelain/35">
          Search platform
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   PRIME VIDEO
========================================================= */

function PrimeLogo() {
  return (
    <div className="flex items-center gap-4">

      <div className="relative flex min-w-[125px] flex-col items-start">

        <p className="text-xl font-medium tracking-tight text-porcelain">
          prime video
        </p>


        <svg
          viewBox="0 0 120 20"
          className="mt-1 h-4 w-28 overflow-visible"
        >

          <motion.path
            d="M5 4 C42 20, 79 20, 112 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-cyan"

            initial={{
              pathLength: 0,
              opacity: 0,
            }}

            animate={{
              pathLength: 1,
              opacity: 1,
            }}

            transition={{
              duration: 1.1,
              delay: 0.15,
              ease: "easeOut",
            }}
          />


          <motion.path
            d="M104 3 L112 4 L107 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cyan"

            initial={{
              opacity: 0,
            }}

            animate={{
              opacity: 1,
            }}

            transition={{
              delay: 0.9,
            }}
          />

        </svg>

      </div>


      <div className="text-left">

        <p className="text-[9px] uppercase tracking-[0.24em] text-porcelain/35">
          Search platform
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   APPLE TV
   Apple mark corrected here
========================================================= */

function AppleTVLogo() {
  return (
    <div className="flex items-center gap-4">

      <motion.div
        whileHover={{
          y: -2,
          scale: 1.04,
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 16,
        }}
        className="flex items-center gap-2"
      >

        {/* Apple Logo */}
        <svg
          viewBox="0 0 48 58"
          className="h-10 w-9 shrink-0"
          aria-hidden="true"
        >

          {/* Leaf */}
          <path
            d="M29.8 9.3C32.7 5.5 36.9 3 41.2 2.8C41.1 7.2 39 11.2 35.8 13.8C33.2 15.9 30.2 15.8 28.6 15.5C28.5 13.3 28.9 11.2 29.8 9.3Z"
            fill="currentColor"
            className="text-porcelain"
          />

          {/* Apple Body */}
          <path
            d="M39.5 30.2C39.4 23.5 44.9 20.2 45.2 20C42.1 15.5 37.4 14.9 35.7 14.8C31.6 14.4 27.7 17.2 25.6 17.2C23.4 17.2 20.2 14.8 16.7 14.9C12.2 15 8 17.5 5.6 21.4C0.8 29.6 4.4 41.5 9.1 48.2C11.3 51.5 14 55 17.5 54.9C21 54.7 22.3 52.7 26.4 52.7C30.6 52.7 31.8 54.9 35.5 54.8C39.2 54.7 41.6 51.6 43.8 48.3C46.4 44.5 47.5 40.8 47.5 40.6C47.4 40.6 39.7 37.6 39.5 30.2Z"
            fill="currentColor"
            className="text-porcelain"
          />

        </svg>


        <span className="text-3xl font-medium tracking-tight text-porcelain">
          tv
        </span>

      </motion.div>


      <div className="text-left">

        <p className="text-sm font-medium text-porcelain">
          Apple TV
        </p>

        <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-porcelain/35">
          Search platform
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   DISNEY+
========================================================= */

function DisneyLogo() {
  return (
    <div className="flex items-center gap-4">

      <div className="relative min-w-[120px]">

        <svg
          viewBox="0 0 150 42"
          className="absolute -top-6 left-0 h-8 w-32 overflow-visible"
        >

          <motion.path
            d="M5 35 C35 4, 92 2, 140 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-cyan/70"

            initial={{
              pathLength: 0,
              opacity: 0,
            }}

            animate={{
              pathLength: 1,
              opacity: 1,
            }}

            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
          />

        </svg>


        <p className="font-display text-2xl text-porcelain">
          Disney+
        </p>

      </div>


      <div className="text-left">

        <p className="text-[9px] uppercase tracking-[0.24em] text-porcelain/35">
          Search platform
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   PLATFORM BRAND
========================================================= */

function PlatformBrand({
  name,
}: {
  name: PlatformName;
}) {

  if (name === "Netflix") {
    return <NetflixLogo />;
  }

  if (name === "Prime Video") {
    return <PrimeLogo />;
  }

  if (name === "Apple TV") {
    return <AppleTVLogo />;
  }

  return <DisneyLogo />;
}


/* =========================================================
   MAIN SCENE
========================================================= */

export function WatchOptionsScene() {

  const recommendation = useExperienceStore(
    (s) => s.recommendation
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );


  if (!recommendation) {
    return null;
  }


  const movie =
    recommendation.movie;


  const openPlatform = (
    platform: Platform
  ) => {

    window.open(
      platform.searchUrl(
        movie.title
      ),
      "_blank",
      "noopener,noreferrer"
    );

  };


  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24">

      <HeroPosterField />


      {/* Ambient glow */}

      <div className="pointer-events-none absolute left-[18%] top-[18%] h-[30rem] w-[30rem] rounded-full bg-gold/[0.07] blur-[130px]" />

      <div className="pointer-events-none absolute bottom-[8%] right-[12%] h-[28rem] w-[28rem] rounded-full bg-violet/[0.08] blur-[140px]" />


      {/* Main glass container */}

      <motion.div
        initial={{
          opacity: 0,
          y: 24,
          scale: 0.985,
        }}

        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}

        transition={{
          duration: 0.8,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}

        className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2.4rem] border border-porcelain/10 bg-midnight/55 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8 lg:p-10"
      >

        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:items-center">


          {/* =================================================
              POSTER
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: -24,
              rotate: -1.5,
            }}

            animate={{
              opacity: 1,
              x: 0,
              rotate: 0,
            }}

            transition={{
              delay: 0.12,
              duration: 0.8,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}

            className="relative mx-auto w-[210px] sm:w-[230px] lg:w-[260px]"
          >

            <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-gold/10 blur-[35px]" />


            <div className="relative aspect-[2/3] overflow-hidden rounded-[1.8rem] border border-white/10 shadow-2xl shadow-black/50">

              <Image
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                fill
                sizes="260px"
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/[0.04]" />

            </div>

          </motion.div>


          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="flex flex-col items-center text-center">


            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.2,
                duration: 0.7,
              }}

              className="w-full"
            >

              <p className="text-[10px] uppercase tracking-[0.52em] text-gold/70">
                Movie Night
              </p>


              <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-porcelain sm:text-6xl lg:text-7xl">
                Ready to watch?
              </h1>


              <p className="mx-auto mt-4 max-w-3xl font-display text-xl leading-relaxed text-gold sm:text-2xl">
                {movie.title}
              </p>


              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-porcelain-dim">
                Try searching for your movie on one of these streaming platforms.
                Availability can vary depending on your region.
              </p>

            </motion.div>


            {/* =================================================
                PLATFORMS
            ================================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.36,
                duration: 0.7,
              }}

              className="mt-8 w-full"
            >

              <div className="mb-5 flex items-center justify-center gap-4">

                <span className="h-px w-10 bg-gold/40" />

                <p className="text-[10px] uppercase tracking-[0.38em] text-porcelain/45">
                  Try one of these
                </p>

                <span className="h-px w-10 bg-gold/40" />

              </div>


              <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">


                {PLATFORMS.map(
                  (
                    platform,
                    index
                  ) => (

                    <motion.button
                      key={
                        platform.name
                      }

                      type="button"

                      onClick={() =>
                        openPlatform(
                          platform
                        )
                      }

                      initial={{
                        opacity: 0,
                        y: 12,
                      }}

                      animate={{
                        opacity: 1,
                        y: 0,
                      }}

                      transition={{
                        delay:
                          0.46 +
                          index * 0.07,

                        duration:
                          0.55,
                      }}

                      whileHover={{
                        y: -5,
                        scale: 1.012,
                      }}

                      whileTap={{
                        scale: 0.985,
                      }}

                      className="group relative min-h-[112px] overflow-hidden rounded-2xl border border-porcelain/10 bg-white/[0.035] px-6 py-5 text-left transition-all hover:border-gold/30 hover:bg-white/[0.06] hover:shadow-[0_20px_50px_-25px_rgba(242,200,121,0.3)]"
                    >


                      {/* subtle glow */}

                      <motion.div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/[0.06] blur-3xl"

                        animate={{
                          opacity: [
                            0.2,
                            0.5,
                            0.2,
                          ],
                        }}

                        transition={{
                          duration:
                            4 + index,

                          repeat:
                            Infinity,

                          ease:
                            "easeInOut",
                        }}
                      />


                      <div className="relative flex items-center justify-between gap-4">

                        <PlatformBrand
                          name={
                            platform.name
                          }
                        />


                        <motion.span
                          className="text-xl text-gold/60"

                          whileHover={{
                            x: 3,
                            y: -3,
                          }}
                        >
                          ↗
                        </motion.span>

                      </div>

                    </motion.button>

                  )
                )}

              </div>

            </motion.div>


            {/* =================================================
                I'M BACK
            ================================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.82,
                duration: 0.65,
              }}

              className="mt-8 flex flex-col items-center gap-3"
            >

              <MagneticButton
                onClick={() =>
                  goTo(
                    "afterMovie"
                  )
                }
              >
                I&apos;m Back
              </MagneticButton>


              <p className="text-[10px] uppercase tracking-[0.25em] text-porcelain/30">
                Come back when the credits roll 🍿
              </p>

            </motion.div>

          </div>

        </div>

      </motion.div>

    </section>
  );
}