import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, UserPlus, Handshake } from "lucide-react";
import { useLanguage } from "./language-context";
import { useTheme } from "./theme-context";
import { useNavigation } from "./navigation-context";
import { useAuth } from "./auth-context";
import { WaitlistModal } from "./WaitlistModal";
import { Button } from "./ui/button";
import { useAdmin } from "./admin/admin-context";

import imgHeroDay1 from "figma:asset/1eb66c90883038148bef6beb46db42e192c9081a.png";
import imgHeroNight1 from "figma:asset/58f2032dbd9943c8a824af7bac117d4d80a2759a.png";
import imgHeroDay2 from "figma:asset/8bd47d8e100313825c5064c9293eb546bbd1439b.png";
import imgHeroNight2 from "figma:asset/9c2a266fc75ee0d14c4f90fcc7048c43aacf15ab.png";
import imgHeroDay3 from "figma:asset/952298a15095e02d75ce6bcb3eae5e8536e2b81d.png";
import imgHeroNight3 from "figma:asset/9317daba9e3bc1e9285d8d18b9fd3d5efa355d84.png";
import imgMemoryBg from "figma:asset/16c660e3695c905d2b6311d4f9b377ad85f93cbd.png";
import imgMemoryHero from "figma:asset/d63d94e538aa40b38f3d348626c30181fc361a36.png";

const scenarios = [
  {
    id: 1,
    day: imgHeroDay1,
    night: imgHeroNight1,
    alt: "Interactive Learning",
  },
  {
    id: 2,
    day: imgHeroDay2,
    night: imgHeroNight2,
    alt: "Collaborative Exploration",
  },
  {
    id: 3,
    day: imgHeroDay3,
    night: imgHeroNight3,
    alt: "Family Connection",
  },
  {
    id: 4,
    day: imgMemoryHero,
    night: imgMemoryHero,
    alt: "Baseul Memory",
  },
];

export function Hero() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { setView } = useNavigation();
  const { isLoggedIn } = useAuth();
  const { content } = useAdmin();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % scenarios.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentScenario = scenarios[currentIndex];
  const currentImage =
    theme === "dark"
      ? currentScenario.night
      : currentScenario.day;

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center overflow-hidden">
      {/* Full Screen Background Carousel */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={currentImage}
              alt={currentScenario.alt}
              className="w-full h-full object-cover object-[center_60%] opacity-80 [mask-image:radial-gradient(circle_at_center_60%,black_30%,transparent_90%)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center pt-32 pb-20 flex flex-col items-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-8"
        >
          <span
            className={`block text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}
          >
            {content["home.hero.subtitle"] || t("hero.eyebrow")}
          </span>
          <h1 className="text-4xl md:text-8xl font-black tracking-tight mb-4 leading-tight flex flex-col items-center space-y-4">
            <span
              className={`block ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {content["home.hero.title"] ||
                t("hero.title.line1")}
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 pb-2">
              {t("hero.title.line2")}
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl font-medium max-w-2xl mx-auto ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
          >
            {t("hero.subtitle")}
          </p>
        </motion.div>

        {/* Spacer to push CTA buttons down to the 'lower part of the image' (which is visually centered at 60%) */}
        <div className="flex-grow min-h-[15vh] md:min-h-[35vh]"></div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20"
        >
          {/* Button 1: Join / Get Started */}
          <button
            onClick={() => setView(isLoggedIn ? 'product-early' : 'login')}
            className={`group relative inline-flex items-center gap-6 pl-8 pr-2 py-2 rounded-full shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border ${
              theme === "dark"
                ? "border-white/10 shadow-purple-900/20 bg-black/20 backdrop-blur-sm"
                : "border-slate-200 shadow-slate-200 bg-white/20 backdrop-blur-sm"
            }`}
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-[length:200%_auto] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy" />

            {/* Normal Background (Transparent/Blurry) */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 ${
                theme === "dark"
                  ? "bg-[#0B0F19]/40"
                  : "bg-white/40"
              }`}
            />

            {/* Text Content */}
            <span
              className={`relative z-10 font-bold text-lg tracking-wide transition-colors duration-300 ${
                theme === "dark"
                  ? "text-white"
                  : "text-slate-900 group-hover:text-white"
              }`}
            >
              {isLoggedIn ? t("hero.cta.getStarted") : t("hero.cta.join")}
            </span>

            {/* Icon Container */}
            <div className="relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-90">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ArrowRight className="relative z-10 w-5 h-5 text-white transition-transform duration-300" />
            </div>
          </button>

          {/* Button 2: Become Partner */}
          <button
            onClick={() => setView("partner")}
            className={`group relative inline-flex items-center gap-6 pl-8 pr-2 py-2 rounded-full shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border ${
              theme === "dark"
                ? "border-white/10 shadow-purple-900/20 bg-black/20 backdrop-blur-sm"
                : "border-slate-200 shadow-slate-200 bg-white/20 backdrop-blur-sm"
            }`}
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-[length:200%_auto] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy" />

            {/* Normal Background */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 ${
                theme === "dark"
                  ? "bg-[#0B0F19]/40"
                  : "bg-white/40"
              }`}
            />

            {/* Text Content */}
            <span
              className={`relative z-10 font-bold text-lg tracking-wide transition-colors duration-300 ${
                theme === "dark"
                  ? "text-white"
                  : "text-slate-900 group-hover:text-white"
              }`}
            >
              {t("hero.cta.partner")}
            </span>

            {/* Icon Container */}
            <div className="relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-90">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Handshake className="relative z-10 w-5 h-5 text-white transition-transform duration-300" />
            </div>
          </button>
        </motion.div>

        {/* Indicators */}
        <div className="flex gap-2 z-20 pb-8">
          {scenarios.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? theme === "dark"
                    ? "bg-white w-6"
                    : "bg-slate-900 w-6"
                  : theme === "dark"
                    ? "bg-white/30"
                    : "bg-slate-900/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}