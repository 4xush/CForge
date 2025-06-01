import { Footer, Header } from './Landing/NavBar';
import { motion } from 'framer-motion';

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
        staggerChildren: 0.2
      }
    }
  };

  const childFade = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0F23] text-white overflow-hidden font-sans">
      <Header />
      <main className="max-w-4xl mx-auto mt-12 ">
        <motion.h1
          className="text-4xl font-extrabold mb-6 text-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          About CForge
        </motion.h1>
        <motion.section
          className="space-y-6 text-gray-300 text-lg leading-relaxed"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={childFade}>
            <strong>CForge</strong> was born out of a simple observation — many students are actively building projects,
            solving problems on platforms like LeetCode, GitHub, or Codeforces, yet their efforts often go unnoticed by peers.
            At the same time, others remain unaware of these platforms or how to get started, creating an invisible gap in motivation and collaboration.
          </motion.p>
          <motion.p variants={childFade}>
            This disconnect inspired the creation of CForge: a collaborative space where developers can come together,
            create rooms, track their progress, and stay aware of each other's journeys — no matter where they are in their coding path.
          </motion.p>
          <motion.p variants={childFade}>
            CForge empowers coders by providing a unified dashboard to monitor growth across popular platforms,
            while enabling healthy peer competition through real-time leaderboards and insightful statistics.
          </motion.p>
          <motion.p variants={childFade}>
            Whether you're preparing for interviews, grinding contests, or just starting out, CForge helps bring visibility to your efforts,
            fosters community-driven learning, and transforms scattered progress into shared momentum.
          </motion.p>
          <motion.p variants={childFade}>
            Join CForge — not just to track your coding, but to connect with like-minded peers, grow together, and stay inspired on the journey.
          </motion.p>
          <motion.div variants={childFade} className="mt-8">
            <a
              href="https://v0-ayush-kumar-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-300"
            >
              Visit Developer Page
            </a>
          </motion.div>
        </motion.section>
      </main>
      <div className="pb-12"></div>
      <Footer />
    </div>
  );
};

export default AboutCForge;