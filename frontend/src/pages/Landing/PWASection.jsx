import { SmartphoneIcon, DownloadCloud, Zap, WifiOff } from "lucide-react";

const PWASection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-[#0A0F23] to-[#141d41] text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Install CForge on Your Device
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Access your LeetCode tracker and room leaderboards anywhere with our
            Progressive Web App
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-[#1A1F42]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg">
            <div className="mb-4 bg-purple-500/10 p-3 rounded-lg inline-block">
              <SmartphoneIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mobile Installation</h3>
            <p className="text-gray-300">
              Install CForge on Android and iOS devices for a native app
              experience without app stores
            </p>
          </div>

          <div className="bg-[#1A1F42]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg">
            <div className="mb-4 bg-purple-500/10 p-3 rounded-lg inline-block">
              <WifiOff className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Offline Access</h3>
            <p className="text-gray-300">
              Continue reviewing your LeetCode problems and progress even
              without internet connection
            </p>
          </div>

          <div className="bg-[#1A1F42]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg">
            <div className="mb-4 bg-purple-500/10 p-3 rounded-lg inline-block">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Push Notifications</h3>
            <p className="text-gray-300">
              Get timely reminders for problem reviews and stay updated on room
              activities
            </p>
          </div>

          <div className="bg-[#1A1F42]/80 p-6 rounded-xl border border-purple-900/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg">
            <div className="mb-4 bg-purple-500/10 p-3 rounded-lg inline-block">
              <DownloadCloud className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Installation</h3>
            <p className="text-gray-300">
              Click the install icon in your browser or "Add to Home Screen" on
              mobile devices
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            className="px-6 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
            onClick={() => window.open("/help", "_blank")}
          >
            Learn How to Install
          </button>
        </div>
      </div>
    </section>
  );
};

export default PWASection;
