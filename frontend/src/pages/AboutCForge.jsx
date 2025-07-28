import { Footer } from "./Landing/NavBar";
import { motion } from "framer-motion";

const AboutCForge = () => {
  // Animation variants for fade-in effect
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const childFade = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#0A0F23] text-white overflow-hidden font-sans py-6 sm:py-12">
      <main className="max-w-4xl mx-auto mt-6 sm:mt-12 px-3 sm:px-0">
        <motion.h1
          className="text-2xl sm:text-4xl font-extrabold mb-4 sm:mb-6 text-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          About & Motivation — CForge
        </motion.h1>
        <motion.section
          className="space-y-4 sm:space-y-6 text-gray-300 text-base sm:text-lg leading-relaxed"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <strong>CForge</strong> is a powerful platform focused on LeetCode
            tracking and competitive programming progress, designed to solve two
            critical problems: consistently reviewing important coding problems
            and maintaining motivation through peer competition. While many
            programmers actively solve problems on LeetCode and Codeforces, they
            often struggle with systematic review and miss the motivational
            benefits of peer awareness and healthy competition.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            These challenges inspired the creation of CForge: a comprehensive
            solution with an advanced LeetCode Problem Tracker featuring smart
            review reminders and room-based leaderboards where programmers can
            come together, track their progress, compare statistics, and stay
            motivated through peer competition — all available as a Progressive
            Web App with offline capabilities.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <span className="font-semibold text-purple-300">Motivation:</span>{" "}
            At the heart of CForge lies the belief that systematic practice and
            community-driven motivation are the keys to mastering competitive
            programming. Research shows that spaced repetition significantly
            improves long-term retention of problem-solving patterns, while peer
            accountability increases consistency. CForge combines these
            principles into one powerful platform that transforms isolated
            practice into a structured, community-driven experience.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <span className="font-semibold text-purple-300">Key Features:</span>{" "}
            CForge&apos;s LeetCode Problem Tracker automatically syncs your
            solved problems and implements a smart reminder system for optimized
            review schedules. The room-based leaderboards create healthy
            competition while our PWA implementation ensures you can access your
            tracked problems and statistics even offline. With push
            notifications for reminders and real-time room chat for
            collaboration, CForge creates a complete ecosystem for competitive
            programming success.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            Whether you&apos;re preparing for technical interviews, improving
            your competitive programming skills, or just starting your coding
            journey, CForge helps you maintain consistent practice through
            structured reviews, fosters community-driven motivation through
            leaderboards, and provides accessibility through modern PWA
            technology.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <a
              href="/signup"
              className="underline text-blue-600 hover:text-blue-400 transition-colors"
            >
              Join CForge
            </a>{" "}
            — to track your LeetCode progress with smart review reminders, join
            room-based leaderboards for motivation, and access your coding stats
            anytime with our mobile-friendly PWA.
          </motion.p>

          <motion.div
            className="border-t border-purple-900/30 pt-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <h2 className="text-lg sm:text-xl font-bold text-purple-300 mb-2">
              About the Developer
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              <span className="font-semibold text-white">Ayush Kumar</span> -
              B.Tech undergraduate student at{" "}
              <a
                href="https://www.iiitg.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-400 transition-colors"
              >
                IIIT-Guwahati
              </a>{" "}
              specializing in Electronics and Communication Engineering, with a
              passion for problem-solving and building user-focused
              applications.
            </p>
            <a
              href="https://4xush.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 text-sm sm:text-base mt-4"
            >
              Visit Developer Page
            </a>
          </motion.div>
        </motion.section>
      </main>
      <div className="pb-16 sm:pb-12"></div>
      <Footer />
    </div>
  );
};

export default AboutCForge;
