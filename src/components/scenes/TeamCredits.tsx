"use client";

import { motion } from "framer-motion";

/* =========================================================
   TEAM CREDITS

   Sits at the bottom of the final scene. Tracking parameters
   were stripped from the LinkedIn URLs: the utm_* and
   share_via values are mobile-app share artifacts, they are
   not needed to reach a profile, and they leak how the link
   was shared.
========================================================= */

type Member = {
  name: string;
  linkedin: string;
};

const TEAM: Member[] = [
  {
    name: "Maram Alzahrani",
    linkedin: "https://www.linkedin.com/in/maram-alzahrani314",
  },
  {
    name: "Yasser Alghamedi",
    linkedin: "https://www.linkedin.com/in/yasir-data",
  },
  {
    name: "Rana Aljuaid",
    linkedin: "https://www.linkedin.com/in/rana-aljuaid-494374363",
  },
  {
    name: "Yasser Alqulaytiid",
    linkedin: "https://www.linkedin.com/in/yasser-alqulayti-0b7609386",
  },
  {
    name: "Sumaya Alsuhimi",
    linkedin: "https://www.linkedin.com/in/sumaya-alsuhimi",
  },
];

function LinkedInMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 fill-current"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05a4.16 4.16 0 0 1 3.75-2.06c4 0 4.75 2.63 4.75 6.06V21h-4v-5.5c0-1.31-.03-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
    </svg>
  );
}

export function TeamCredits() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl px-2 pb-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="text-[10px] uppercase tracking-[0.5em] text-porcelain-dim">
          Full Credits
        </span>

        <h2 className="font-display text-3xl tracking-tight text-porcelain sm:text-4xl">
          THE CINEMIX TEAM
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-porcelain/10 overflow-hidden rounded-2xl border border-porcelain/12 bg-porcelain/[0.03]">
        {TEAM.map((member, i) => (
          <motion.a
            key={member.linkedin}
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.5,
              delay: i * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-porcelain/[0.06]"
          >
            <span className="text-base text-porcelain/85 transition-colors group-hover:text-porcelain sm:text-lg">
              {member.name}
            </span>

            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-porcelain-dim transition-colors group-hover:text-gold">
              <LinkedInMark />
              LinkedIn
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
