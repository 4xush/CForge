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
            <strong>CForge</strong> is a coding community platform with progress
            analytics designed to solve a fundamental problem in the coding
            community: the disconnect between individual progress on coding
            platforms and peer awareness. While many students actively solve
            problems on LeetCode, GitHub, and Codeforces, their efforts often
            remain invisible to their peers, creating missed opportunities for
            motivation, collaboration, and mentorship.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            This disconnect inspired the creation of CForge: a collaborative
            space where developers can come together, create rooms, track their
            progress, and stay aware of each other's journeys — no matter where
            they are in their coding path.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <span className="font-semibold text-purple-300">Motivation:</span>{" "}
            At the heart of CForge lies the belief that visibility and community
            are key drivers of growth. When you see your peers striving,
            building, and overcoming challenges, it sparks a sense of healthy
            competition and shared ambition. CForge is built to transform
            isolated coding journeys into a collective experience—where every
            milestone is celebrated, and every setback is met with support.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            CForge empowers coders by providing a unified dashboard to monitor
            growth across popular platforms, while enabling healthy peer
            competition through real-time leaderboards and insightful
            statistics.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            Whether you're preparing for interviews, grinding contests, or just
            starting out, CForge helps bring visibility to your efforts, fosters
            community-driven learning, and transforms scattered progress into
            shared momentum.
          </motion.p>
          <motion.p variants={childFade} className="text-sm sm:text-base">
            <a
              href="/signup"
              className="underline text-blue-600 hover:text-blue-400 transition-colors"
            >
              Join CForge
            </a>{" "}
            — not just to track your coding, but to connect with like-minded
            peers, grow together, and stay inspired on the journey.
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
              <span className="font-semibold text-white">Ayush Kumar</span> is a
              B.Tech student at{" "}
              <a
                href="https://www.iiitg.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-400 transition-colors"
              >
                IIIT Guwahati
              </a>{" "}
              specializing in Electronics and Communication Engineering. With a
              passion for problem-solving and building robust application.
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
