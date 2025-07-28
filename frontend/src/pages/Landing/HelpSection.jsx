import { HelpCircle, MessageSquare } from "lucide-react";

const HelpSection = () => {
  return (
    <section className="py-16 bg-[#0A0F23] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1A1F42]/90 to-[#141B3F]/90 p-8 rounded-xl border border-purple-900/30 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-purple-500/10 p-5 rounded-full">
              <HelpCircle className="w-16 h-16 text-purple-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Need Help Getting Started?
              </h2>
              <p className="text-gray-300 mb-6">
                Our comprehensive Help & FAQ section covers everything from
                account setup to PWA installation. If you encounter any issues,
                our easy-to-use error reporting feature ensures quick
                assistance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="px-5 py-2.5 text-base font-medium rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  onClick={() => window.open("/help", "_blank")}
                >
                  <HelpCircle className="w-4 h-4" />
                  Visit Help & FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HelpSection;
