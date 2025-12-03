import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Battery, Shield, Zap, Cpu, HardDrive, Cloud, Share2, Clock, Sun, Moon, BookOpen, Target, Smile, Heart, BarChart3, Lock, Mic, Smartphone, Users, Award, Volume2, Droplets, Wifi, Camera, MessageCircle, EyeOff, Ban, Activity, Eye, Footprints, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { useNavigation } from './navigation-context';
import { useLanguage } from './language-context';
import { useTheme } from './theme-context';
import { useAdmin } from './admin/admin-context';
import { useAuth } from './auth-context';
import { ProductWaitlist } from './ProductWaitlist';

// Product Images
import imgGrowth from 'figma:asset/e18a92ced248d352c4c7d105a2ffe6847f6886fe.png';
import imgEarly from 'figma:asset/5880af9c8591f0077537c38fdd981ed4c4030d77.png';
import imgMemory from 'figma:asset/3d1e625e1158e8a0c194b80170fc6f75c5bc139f.png';
import imgEarlyCardBg from 'figma:asset/1255130083c44e8ed92aad9eb57a1162f1aec017.png';
import imgEarlyDreamMode from 'figma:asset/c4b5c1d65ef0de6f999df230c885be4c210103a0.png';
import imgExploreProduct from 'figma:asset/4eab635088fa96b3b4c760608745ce34378feb72.png';
import imgExploreSc1Day from 'figma:asset/60526b5d8fb1fd0cd5213b63473e42d5a9018092.png';
import imgExploreSc1Night from 'figma:asset/cfab305c00da2820d9fb08a9c3e8e68cf1a6c3e4.png';

import imgGrowthSc4Night from 'figma:asset/4b6290ceaa5e9db680d9d5b480fc259266ca79d0.png';

// New Growth Images
import imgGrowthTask from 'figma:asset/bea1c28c7e1c69f919f5dce6c413d64bd704a8a5.png';
import imgGrowthSocial from 'figma:asset/4bca08a6050221cc937f2553c4507b199f1b6103.png';
import imgGrowthTime from 'figma:asset/9c2a266fc75ee0d14c4f90fcc7048c43aacf15ab.png'; // Also Carousel 2
import imgGrowthInterest from 'figma:asset/58f2032dbd9943c8a824af7bac117d4d80a2759a.png'; // Reusing Hero Night 1
import imgGrowthMeta from 'figma:asset/9317daba9e3bc1e9285d8d18b9fd3d5efa355d84.png'; // Reusing Hero Night 3

// User provided replacements
import imgGrowthDetail5 from 'figma:asset/13e565204c3f30eac857688b96750a37d56b9f36.png';
import imgGrowthSc2New from 'figma:asset/587d4e5eb3e52dcad71fdfe9ddeb8b6f227bc583.png';
import imgGrowthDetail2New from 'figma:asset/349c70b344f92da5513237846f00ebe3fd11b5c4.png';
import imgGrowthSc3New from 'figma:asset/20cc8f884efd802064dc1ed5fb04c9183b29c0c0.png';
import imgGrowthSc4New from 'figma:asset/51d444732ecc2dacc806ce9651a0c4619f877c1d.png';
import imgGrowthSc5New from 'figma:asset/ab8a2b1d0c8fba7b58614d44d14601f754448522.png';

// New Detail Images
import imgEarlyDetail1 from 'figma:asset/b729a8488ead2d6527ce4646d1ecf3046061c8e0.png';
import imgEarlyDetail2 from 'figma:asset/3277aba3ef7fe3a904a624cd8f92fe7ac5b3ac85.png';
import imgEarlySc2 from 'figma:asset/4e9cf61b8624581cd9f4fcf3de295c76c83f1ad5.png';
import imgEarlySc3 from 'figma:asset/598e1b2e4c2980edea0043a2b17a2c07fc2b83fb.png';
import imgEarlySc4 from 'figma:asset/6dc29173699f078e7971efcd7a1db97b20934f68.png';
import imgEarlySc5 from 'figma:asset/887069fffc7824ee684936dc570ab909696b39dc.png';
import imgSafetyExploded from 'figma:asset/837923ec7e89a5ab5d54e9c32d6cc8465af80096.png';
import imgTrustGrowth from 'figma:asset/f36a54559f8025649f5204abace1704784546282.png';
import imgCoreUI from 'figma:asset/83819e33d3a0feaa3d5694ee37d08d4fbc715db4.png';

interface BentoItem {
  title: string;
  desc?: string;
  sub?: string;
  icon: any;
  color: string;
}

interface SafetyItem {
  text: string;
  sub: string;
  icon: any;
}

interface ProductData {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  description: string;
  features: string[];
  specs: { label: string; value: string; icon: any }[];
  images: string[];
  badge: string;
  scenarios: { title: string; desc: string; icon: any; time: string }[];
  bento: BentoItem[];
  safety: SafetyItem[];
}

export function ProductDetail({ type }: { type: 'early' | 'growth' | 'explore' }) {
  const { setView } = useNavigation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { content } = useAdmin();
  const { currentUser, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [addMemory, setAddMemory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSafety, setActiveSafety] = useState<number | null>(null);
  const [activeCoreModule, setActiveCoreModule] = useState<number | null>(0);

  // Reset selected image when product type changes
  React.useEffect(() => {
    setSelectedImage(null);
  }, [type]);

  // Baseul Memory Data
  const memoryProduct = {
    title: "Baseul Memory",
    price: 129,
    description: "A private, local-first cloud for your child's entire cognitive journey. Securely stores voice logs, growth metrics, and creative works forever.",
    image: imgMemory,
    features: ["Local Privacy Encryption", "Lifetime Timeline", "Family Sharing"]
  };

  // Mock Data
  const products: Record<string, ProductData> = {
    early: {
      id: 'early',
      title: t('p1.title'),
      subtitle: t('p1.age'),
      price: 199,
      badge: t('p1.badge'),
      description: t('p1.desc'),
      features: [
        t('p1.list.1'), t('p1.list.2'), t('p1.list.3'), t('p1.list.4'), t('p1.list.5')
      ],
      specs: [
        { label: t('spec.battery'), value: t('spec.val.battery'), icon: Battery },
        { label: t('spec.material'), value: t('spec.val.material'), icon: Shield },
        { label: t('spec.aicore'), value: t('spec.val.aicore'), icon: Cpu },
      ],
      images: [
        imgEarly,
        imgEarlyCardBg,
        imgEarlyDetail1,
        imgEarlyDetail2,
        imgEarlyDreamMode // 4th small image
      ],
      scenarios: [
        { title: t('p1.sc.1.title'), desc: t('p1.sc.1.desc'), icon: Sun, time: "07:00 AM" },
        { title: t('p1.sc.2.title'), desc: t('p1.sc.2.desc'), icon: BookOpen, time: "03:00 PM" },
        { title: t('p1.sc.3.title'), desc: t('p1.sc.3.desc'), icon: Moon, time: "08:30 PM" }
      ],
      bento: [
        { title: t('p1.bento.1.title'), desc: t('p1.bento.1.desc'), icon: Clock, color: 'cyan' },
        { title: t('p1.bento.2.title'), sub: t('p1.bento.2.sub'), icon: Footprints, color: 'cyan' },
        { title: t('p1.bento.3.title'), sub: t('p1.bento.3.sub'), icon: Smile, color: 'pink' },
        { title: t('p1.bento.4.title'), sub: t('p1.bento.4.sub'), icon: Camera, color: 'orange' },
        { title: t('p1.bento.5.title'), sub: t('p1.bento.5.sub'), icon: Smartphone, color: 'purple' }
      ],
      safety: [
        { text: t('detail.safety.material'), sub: t('detail.safety.materialSub'), icon: Shield },
        { text: t('detail.safety.eye'), sub: t('detail.safety.eyeSub'), icon: Eye },
        { text: t('detail.safety.control'), sub: t('detail.safety.controlSub'), icon: Smartphone },
        { text: t('detail.safety.memory'), sub: t('detail.safety.memorySub'), icon: Heart }
      ]
    },
    growth: {
      id: 'growth',
      title: content['growth.title'] || t('p2.title'),
      subtitle: content['growth.subtitle'] || t('p2.age'),
      price: content['growth.price'] || 249,
      badge: t('p2.badge'),
      description: content['growth.desc'] || t('p2.desc'),
      features: [
        t('p2.list.1'), t('p2.list.2'), t('p2.list.3'), t('p2.list.4'), t('p2.list.5')
      ],
      specs: [
        { label: t('spec.display'), value: t('spec.val.oled'), icon: Zap },
        { label: t('spec.camera'), value: t('spec.val.ocr'), icon: Shield },
        { label: t('spec.mode'), value: t('spec.val.desk'), icon: Cpu },
      ],
      images: [
        imgGrowth,
        imgGrowthDetail2New,
        imgGrowthSocial,
        imgGrowthTime,
        imgGrowthDetail5
      ],
      scenarios: [
        { title: t('p2.sc.1.title'), desc: t('p2.sc.1.desc'), icon: Target, time: "04:00 PM" },
        { title: t('p2.sc.2.title'), desc: t('p2.sc.2.desc'), icon: Shield, time: "04:20 PM" },
        { title: t('p2.sc.3.title'), desc: t('p2.sc.3.desc'), icon: Zap, time: "05:30 PM" }
      ],
      bento: [
        { title: t('p2.bento.1.title'), desc: t('p2.bento.1.desc'), icon: Clock, color: 'purple' },
        { title: t('p2.bento.2.title'), sub: 'Smart Review', icon: Check, color: 'purple' },
        { title: t('p2.bento.3.title'), sub: 'Voice Helper', icon: MessageCircle, color: 'cyan' },
        { title: t('p2.bento.4.title'), sub: 'Progress Tracking', icon: BarChart3, color: 'orange' },
        { title: 'FOCUS TIMER', sub: 'Deep Work Mode', icon: Target, color: 'pink' }
      ],
      safety: [
        { text: 'LOCAL AI ENGINE', sub: 'Local Processing', icon: Cpu },
        { text: 'POSTURE CHECK', sub: 'Camera Monitoring', icon: Camera },
        { text: 'OLED EYE CARE', sub: 'Low Blue Light', icon: Eye },
        { text: 'PARENT CONTROL', sub: 'App Management', icon: Smartphone }
      ]
    },
    explore: {
      id: 'explore',
      title: t('p3.title'),
      subtitle: t('p3.age'),
      price: 399,
      badge: t('p3.badge'),
      description: t('p3.desc'),
      features: [
        t('p3.list.1'), t('p3.list.2'), t('p3.list.3'), t('p3.list.4'), t('p3.list.5')
      ],
      specs: [
        { label: t('spec.screen'), value: t('spec.val.eink'), icon: Zap },
        { label: t('spec.input'), value: t('spec.val.stylus'), icon: Cpu },
        { label: t('spec.security'), value: t('spec.val.bio'), icon: Shield },
      ],
      images: [
        imgExploreProduct,
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1453733190371-cf115af04aca?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
      ],
      scenarios: [
        { title: t('p3.sc.1.title'), desc: t('p3.sc.1.desc'), icon: BookOpen, time: "10:00 AM" },
        { title: t('p3.sc.2.title'), desc: t('p3.sc.2.desc'), icon: Share2, time: "02:00 PM" },
        { title: t('p3.sc.3.title'), desc: t('p3.sc.3.desc'), icon: Cloud, time: "08:00 PM" }
      ],
      bento: [
         { title: t('p3.bento.1.title'), desc: t('p3.bento.1.desc'), icon: HardDrive, color: 'blue' },
         { title: 'PROJECT MANAGER', sub: 'Goal Planning', icon: Target, color: 'blue' },
         { title: 'KNOWLEDGE BASE', sub: 'Obsidian Sync', icon: Share2, color: 'cyan' },
         { title: 'CODING MODE', sub: 'Python/JS', icon: Cpu, color: 'orange' },
         { title: 'TEAM SYNC', sub: 'Collaboration', icon: Users, color: 'pink' }
      ],
      safety: [
         { text: 'BIOMETRIC LOCK', sub: 'Fingerprint ID', icon: Lock },
         { text: 'SYSTEM SANDBOX', sub: 'Safe Browsing', icon: Shield },
         { text: 'E-INK MODE', sub: 'Zero Eye Strain', icon: Sun },
         { text: 'DATA SOVEREIGNTY', sub: 'You Own Your Data', icon: Cloud }
      ]
    }
  };

  const product = products[type];
  const themeColor = type === 'early' ? 'cyan' : type === 'growth' ? 'purple' : 'blue';
  const gradient = type === 'early' ? 'from-cyan-400 to-cyan-600' : type === 'growth' ? 'from-purple-400 to-purple-600' : 'from-blue-400 to-blue-600';

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // For logged-in users, use their email; for guests, use the form email
    const userEmail = isLoggedIn ? currentUser?.email : email;
    if(userEmail) {
      setJoined(true);
      // TODO: Save to waitlist with user info
      console.log('User joined waitlist:', { email: userEmail, product: type, addMemory });
    }
  };

  const totalPrice = addMemory ? product.price + memoryProduct.price : product.price;

  // Helper to check if the current image is a scenario (full bleed)
  const isScenario = selectedImage && selectedImage !== product.images[0];

  return (
    <div className="pt-32 pb-20 relative z-20">
      <div className="container mx-auto px-4">
        
        {/* Back Button */}
        <button 
          onClick={() => setView('home')}
          className={`flex items-center gap-2 transition-colors mb-8 font-bold ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ArrowLeft className="w-4 h-4" /> {t('detail.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          
          {/* Left: Images */}
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] bg-white transition-all duration-300 ${
                 isScenario 
                   ? 'border-0' 
                   : (theme === 'dark' ? 'border-4 border-white/5' : 'border-4 border-white')
               }`}
             >
               <motion.img 
                  key={selectedImage || product.images[0]}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedImage || product.images[0]} 
                  alt={product.title} 
                  className={`w-full h-full transition-all duration-300 ${
                    isScenario ? 'object-cover p-0' : 'object-contain p-8'
                  }`} 
               />
               <div className="absolute top-6 left-6 pointer-events-none">
                  <span className={`px-4 py-2 rounded-full backdrop-blur-xl font-black text-sm uppercase tracking-widest shadow-lg ${
                    theme === 'dark' ? 'bg-black/40 text-white border border-white/20' : `bg-white/90 text-${themeColor}-600`
                  }`}>
                    {product.badge}
                  </span>
               </div>
             </motion.div>
             <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(img)}
                    className={`rounded-2xl overflow-hidden h-24 border-2 cursor-pointer transition-all duration-300 ${
                      (selectedImage === img || (!selectedImage && idx === 0)) 
                        ? `border-${themeColor}-500 ring-2 ring-${themeColor}-200 scale-95`
                        : theme === 'dark' ? 'border-white/10 hover:border-white/30' : 'border-white/50 hover:border-slate-300'
                    }`}
                  >
                     <img src={img} alt={`Detail ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Info & Action */}
          <div>
             <motion.h1 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`text-4xl md:text-5xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
             >
               {product.title}
             </motion.h1>
             <p className={`text-xl font-bold text-${themeColor}-500 mb-6`}>{product.subtitle}</p>
             
             <div className="flex items-end gap-4 mb-8">
                <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>${totalPrice}.00</span>
             </div>

             <p className={`text-lg font-medium leading-relaxed mb-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
               {product.description}
             </p>

             {/* Specs Grid */}
             <div className="grid grid-cols-3 gap-4 mb-8">
                {product.specs.map((spec, i) => (
                  <div key={i} className={`p-4 rounded-2xl border text-center backdrop-blur-md ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/50 border-white/60'
                  }`}>
                    <spec.icon className={`w-6 h-6 mx-auto mb-2 text-${themeColor}-500`} />
                    <p className="text-xs text-slate-400 font-bold uppercase">{spec.label}</p>
                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{spec.value}</p>
                  </div>
                ))}
             </div>

             {/* Bundle Section */}
             <div className={`mb-8 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white p-2 border border-slate-200">
                    <img src={memoryProduct.image} alt="Baseul Memory" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('detail.bundle.title')}</h4>
                      <span className="font-bold text-cyan-500">+${memoryProduct.price}</span>
                    </div>
                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('detail.bundle.desc')}
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div 
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          addMemory 
                            ? 'bg-cyan-500 border-cyan-500' 
                            : theme === 'dark' ? 'border-white/30' : 'border-slate-300'
                        }`}
                        onClick={() => setAddMemory(!addMemory)}
                      >
                        {addMemory && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{t('detail.addToOrder')}</span>
                    </label>
                  </div>
                </div>
             </div>

             {/* Features List */}
             <div className="mb-10">
               <h3 className={`font-bold mb-4 uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Key Capabilities</h3>
               <ul className="space-y-3">
                 {product.features.map((feat, i) => (
                   <li key={i} className="flex items-center gap-3">
                     <div className={`p-1 rounded-full bg-${themeColor}-100 text-${themeColor}-600`}>
                       <Check className="w-4 h-4" />
                     </div>
                     <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{feat}</span>
                   </li>
                 ))}
                 {addMemory && memoryProduct.features.map((feat, i) => (
                    <li key={`mem-${i}`} className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-cyan-100 text-cyan-600">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{feat} (Memory)</span>
                    </li>
                 ))}
               </ul>
             </div>

             {/* Waitlist Action */}
             <div className={`p-6 rounded-[2rem] border shadow-xl backdrop-blur-2xl ${
               theme === 'dark' 
                 ? 'bg-white/5 border-white/10 shadow-cyan-900/20' 
                 : 'bg-white/60 border-white/60 shadow-cyan-100/50'
             }`}>
                {!joined ? (
                  <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        Join the Waitlist {addMemory && ' (Bundle)'}
                      </label>
                      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Limited spots available for the first batch.</p>
                    </div>
                    {isLoggedIn ? (
                      <div className="flex flex-col gap-3">
                        <div className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            Joining as: <span className="font-bold">{currentUser?.email}</span>
                          </p>
                        </div>
                        <button 
                          type="submit"
                          className={`w-full px-8 py-3 rounded-xl bg-gradient-to-r ${gradient} text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
                        >
                          Join Waitlist
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className={`flex-1 px-6 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' 
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300'
                          }`}
                        />
                        <button 
                          type="submit"
                          className={`w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r ${gradient} text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className={`w-16 h-16 bg-${themeColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Check className={`w-8 h-8 text-${themeColor}-600`} />
                    </div>
                    <h3 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>You're on the list!</h3>
                    <p className="text-slate-500 font-medium">We'll notify you when {product.title} is ready.</p>
                  </motion.div>
                )}
             </div>
          </div>
        </div>

        {/* Usage Scenarios Section */}
        {type === 'early' ? (
          <div className="mb-24 space-y-24">
            
            {/* 2. Scenario Cards (Redesigned - Editorial Style) */}
            <div className="py-12">
              <div className="mb-24 border-b-2 pb-12 border-slate-200 dark:border-white/10">
                 <div className="flex flex-col gap-8">
                   <h3 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('p1.hero.tagline')}
                   </h3>
                   <div className="max-w-4xl pb-2">
                      <div className="h-2 w-24 bg-cyan-500 mb-6"></div>
                      <p className={`text-xl md:text-2xl font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {t('p1.hero.intro')}
                      </p>
                   </div>
                 </div>
              </div>

              <div className="space-y-12 md:space-y-16">
                {[
                  { 
                    id: '01',
                    eng: t('p1.s1.eng'),
                    title: t('p1.s1.title'), 
                    desc: t('p1.s1.desc'),
                    img: imgEarlyCardBg,
                    imgTitle: t('p1.s1.imgTitle'),
                    imgSub: t('p1.s1.imgSub')
                  },
                  { 
                    id: '02',
                    eng: t('p1.s2.eng'),
                    title: t('p1.s2.title'), 
                    desc: t('p1.s2.desc'),
                    img: imgEarlySc2,
                    imgTitle: t('p1.s2.imgTitle'),
                    imgSub: t('p1.s2.imgSub')
                  },
                  { 
                    id: '03',
                    eng: t('p1.s3.eng'),
                    title: t('p1.s3.title'), 
                    desc: t('p1.s3.desc'),
                    img: imgEarlySc3,
                    imgTitle: t('p1.s3.imgTitle'),
                    imgSub: t('p1.s3.imgSub')
                  },
                  { 
                    id: '04',
                    eng: t('p1.s4.eng'),
                    title: t('p1.s4.title'), 
                    desc: t('p1.s4.desc'),
                    img: imgEarlySc4,
                    imgTitle: t('p1.s4.imgTitle'),
                    imgSub: t('p1.s4.imgSub')
                  },
                  { 
                    id: '05',
                    eng: t('p1.s5.eng'),
                    title: t('p1.s5.title'), 
                    desc: t('p1.s5.desc'),
                    img: imgEarlySc5,
                    imgTitle: t('p1.s5.imgTitle'),
                    imgSub: t('p1.s5.imgSub')
                  }
                ].map((item, i) => (
                   <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 md:gap-8 group`}>
                      
                      {/* Image Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[65%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         <div className={`relative w-full h-[350px] md:h-[400px] md:group-hover:h-[500px] rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group/image ${theme === 'dark' ? 'border-white/10' : `border-${themeColor}-500`}`}>
                            <img 
                                src={item.img} 
                                alt={item.title} 
                                className={`w-full h-full object-cover transition-transform duration-1000 ${
                                   item.id === '03' 
                                      ? '[transform:scaleX(-1)] group-hover:[transform:scale(-1.1,1.1)]' 
                                      : 'group-hover:scale-110'
                                }`} 
                            />
                            
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-500 ${
                                (item.id === '02' || item.id === '03') 
                                    ? 'bg-gradient-to-b from-black/90 via-black/30 to-transparent' 
                                    : 'bg-gradient-to-t from-black/90 via-black/30 to-transparent'
                            }`} />

                            {/* Text Overlay */}
                            <div className={`absolute w-full p-8 z-20 text-white transition-transform duration-500 ${
                                (item.id === '02' || item.id === '03')
                                    ? 'top-0 left-0 -translate-y-4 group-hover/image:translate-y-0'
                                    : 'bottom-0 left-0 translate-y-4 group-hover/image:translate-y-0'
                            }`}>
                               <div className="flex items-center gap-2 mb-3">
                                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Scn. {item.id}</span>
                               </div>
                               <h4 className="text-2xl md:text-3xl font-black mb-3 leading-tight shadow-sm">{item.imgTitle}</h4>
                               <p className="text-sm md:text-base font-medium text-white/90 line-clamp-2 group-hover/image:line-clamp-none transition-all leading-relaxed max-w-lg">
                                 {item.imgSub}
                               </p>
                            </div>
                         </div>
                      </div>

                      {/* Text Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[30%] relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         {/* Background Number */}
                         <span className={`absolute -top-20 -left-10 text-[12rem] leading-none font-black select-none pointer-events-none ${theme === 'dark' ? 'text-white opacity-10' : 'text-slate-900 opacity-5'}`}>
                            {item.id}
                         </span>
                         
                         <div className={`relative pt-10 pl-4 transition-transform duration-700 md:group-hover:scale-90 ${i % 2 === 0 ? 'origin-left' : 'origin-right'}`}>
                            <div className="flex items-center gap-4 mb-4">
                               <div className="h-1 w-12 bg-cyan-500"></div>
                               <h4 className="text-cyan-500 font-black uppercase tracking-widest text-lg">{item.eng}</h4>
                            </div>
                            
                            <h3 className={`text-4xl md:text-6xl font-black leading-tight mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                               {item.title}
                            </h3>
                            
                            <p className={`text-xl font-medium leading-relaxed max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                               {item.desc}
                            </p>
                         </div>
                      </div>

                   </div>
                ))}
              </div>
            </div>

            {/* 3. Feature Cards (Core Modules - Fixed Bento Grid) */}
            <div className="mb-24">
              <div className="flex items-baseline justify-between mb-12 border-b pb-6">
                <h3 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t('detail.coreModules')}
                </h3>
                <span className="text-sm font-bold uppercase tracking-widest text-cyan-500">System v1.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                {(() => {
                  // Determine which set of modules to use based on product type
                  // Default to 'early' if not specified or if type is 'explore' (using early as fallback for now or define explore later)
                  const moduleType = type === 'growth' ? 'growth' : 'early';
                  
                  // Icon mapping for Growth (different from Early)
                  const growthIcons = [CheckCircle2, BookOpen, Mic, Clock, Smartphone]; // Task, Review, Voice, Time, Parent
                  const earlyIcons = [Clock, CheckCircle2, Camera, Smile, Smartphone]; // Rhythm, Task, Photo, Emotion, Parent

                  const icons = type === 'growth' ? growthIcons : earlyIcons;

                  const modules = [
                    {
                      id: 0,
                      title: t(`${moduleType}.core.0.title`),
                      tag: t(`${moduleType}.core.0.tag`),
                      desc: t(`${moduleType}.core.0.desc`),
                      icon: icons[0],
                      color: "cyan"
                    },
                    {
                      id: 1,
                      title: t(`${moduleType}.core.1.title`),
                      tag: t(`${moduleType}.core.1.tag`),
                      desc: t(`${moduleType}.core.1.desc`),
                      icon: icons[1],
                      color: "blue"
                    },
                    {
                      id: 2,
                      title: t(`${moduleType}.core.2.title`),
                      tag: t(`${moduleType}.core.2.tag`),
                      desc: t(`${moduleType}.core.2.desc`),
                      icon: icons[2],
                      color: "purple"
                    },
                    {
                      id: 3,
                      title: t(`${moduleType}.core.3.title`),
                      tag: t(`${moduleType}.core.3.tag`),
                      desc: t(`${moduleType}.core.3.desc`),
                      icon: icons[3],
                      color: "pink"
                    },
                    {
                      id: 4,
                      title: t(`${moduleType}.core.4.title`),
                      tag: t(`${moduleType}.core.4.tag`),
                      desc: t(`${moduleType}.core.4.desc`),
                      icon: icons[4],
                      color: "orange"
                    }
                  ];

                  const activeItem = modules[0];
                  const ActiveIcon = activeItem.icon;

                  return (
                    <>
                       {/* 1. Big Item (Left - Always Expanded) */}
                       <div className={`col-span-1 md:col-span-2 md:row-span-2 rounded-[2rem] p-8 md:p-12 border-2 flex flex-col justify-between relative overflow-hidden ${
                          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                       }`}>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                             <div>
                                <div className="flex justify-between items-start mb-6">
                                   <div className={`p-4 rounded-2xl bg-${activeItem.color}-500 text-white`}>
                                      <ActiveIcon className="w-10 h-10" />
                                   </div>
                                   <span className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest ${
                                      theme === 'dark' ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'
                                   }`}>
                                      {activeItem.tag}
                                   </span>
                                </div>
                                <h4 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                   {activeItem.title}
                                </h4>
                                <p className={`text-lg font-medium leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                   {activeItem.desc}
                                </p>
                             </div>
                             {/* UI Image Always Visible for Big Card */}
                             <div className="relative w-full h-64 mt-8 rounded-2xl overflow-hidden shadow-lg border border-black/5">
                                <img src={imgCoreUI} alt="UI Preview" className="w-full h-full object-cover" />
                             </div>
                          </div>
                       </div>

                       {/* 2. Small Items (Right Grid) */}
                       {modules.slice(1).map((item) => (
                          <div 
                             key={item.id} 
                             className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-6 border-2 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${
                               theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-white border-slate-200 hover:shadow-xl hover:border-slate-300'
                             }`}
                          >
                             {/* Hover Background Image (UI) */}
                             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                                <img src={imgCoreUI} alt="UI Preview" className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-t ${
                                   theme === 'dark' ? 'from-black/95 via-black/80 to-black/40' : 'from-white/95 via-white/80 to-white/40'
                                }`} />
                             </div>

                             <div className="relative z-10 flex flex-col h-full justify-between">
                                {/* Header: Icon Left, Tag Right */}
                                <div className="flex justify-between items-start mb-4">
                                   {/* Colored Icon */}
                                   <div className={`p-3 rounded-xl transition-colors ${
                                      theme === 'dark' 
                                        ? `bg-${item.color}-500/20 text-${item.color}-400` 
                                        : `bg-${item.color}-50 text-${item.color}-600`
                                   }`}>
                                      <item.icon className="w-6 h-6" />
                                   </div>
                                   
                                   {/* Colored Tag (Top Right) */}
                                   <span className={`text-[10px] font-black uppercase tracking-widest py-1 px-2 rounded-lg ${
                                      theme === 'dark' ? `text-${item.color}-400 bg-${item.color}-900/30` : `text-${item.color}-600 bg-${item.color}-50`
                                   }`}>
                                      {item.tag}
                                   </span>
                                </div>
                                
                                {/* Content: Title + Description */}
                                <div>
                                   <h4 className={`text-xl font-black leading-tight mb-3 ${
                                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                                   }`}>
                                      {item.title}
                                   </h4>
                                   
                                   {/* Description Restored */}
                                   <p className={`text-sm font-medium leading-relaxed line-clamp-3 ${
                                      theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
                                   }`}>
                                      {item.desc}
                                   </p>
                                </div>
                             </div>
                          </div>
                       ))}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 4. Trust & Safety (List Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch border-t pt-12">
               <div className="flex flex-col justify-between h-full">
                  <div className="mb-8">
                    <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('detail.safetyFirst')}
                    </h3>
                    <p className={`text-lg font-medium max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('detail.safety.desc')}
                    </p>
                  </div>
                  
                  {/* Interactive Exploded View */}
                  <div className="relative w-full max-w-[140px] mx-auto aspect-[1/2]">
                     <img src={imgSafetyExploded} alt="Safety Anatomy" className="w-full h-full object-contain" />
                     
                     {/* SVG Overlay for Connecting Lines */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-50" viewBox="0 0 400 800">
                        <defs>
                           <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                 <feMergeNode in="coloredBlur"/>
                                 <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                           </filter>
                        </defs>

                        {/* 0: Shell (Bottom) -> List Item 0 (Top) */}
                        {activeSafety === 0 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="200" cy="700" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="200" cy="700" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 200 700 L 320 700 L 320 -320 L 1380 -320" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="-320" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 1: Screen (Top Middle) -> List Item 1 */}
                        {activeSafety === 1 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="200" cy="320" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="200" cy="320" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 200 320 L 340 320 L 340 0 L 1380 0" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="0" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 2: Control/Mainboard (Middle) -> List Item 2 */}
                        {activeSafety === 2 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="200" cy="450" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="200" cy="450" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 200 450 L 360 450 L 360 320 L 1380 320" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="320" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 3: Camera/Memory (Top) -> List Item 3 (Bottom) */}
                        {activeSafety === 3 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="200" cy="150" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="200" cy="150" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 200 150 L 380 150 L 380 640 L 1380 640" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="640" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}
                     </svg>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {product.safety.map((item, i) => (
                    <div 
                      key={i} 
                      onMouseEnter={() => setActiveSafety(i)}
                      onMouseLeave={() => setActiveSafety(null)}
                      className={`group relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 cursor-default ${
                      theme === 'dark' 
                        ? (activeSafety === i ? 'border-cyan-500 bg-white/10' : 'border-white/10 hover:border-white/30') 
                        : (activeSafety === i ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-200 hover:border-cyan-200')
                    }`}>
                       {/* Active Indicator Line (Mobile/Desktop) */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500 rounded-l-2xl transition-opacity duration-300 ${activeSafety === i ? 'opacity-100' : 'opacity-0'}`} />
                       
                       <div>
                          <h5 className={`font-black uppercase tracking-wider transition-colors ${
                             activeSafety === i ? 'text-cyan-600' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                          }`}>{item.text}</h5>
                          <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</p>
                       </div>
                       <div className={`p-3 rounded-full transition-all duration-300 ${
                          activeSafety === i ? 'bg-cyan-500 text-white scale-110' : (theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400')
                       }`}>
                          {React.createElement(item.icon, { className: "w-5 h-5" })}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* 5. Bottom CTA (Huge Typography) */}
            <div className={`py-24 md:py-32 border-y-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
              <div className="flex flex-col md:flex-row items-end justify-between gap-12">
                 <div>
                    <h2 className={`text-6xl md:text-9xl font-black tracking-tighter leading-none mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('detail.startNow')}
                    </h2>
                    <p className={`text-xl md:text-2xl font-bold max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('detail.cta.early.desc')}
                    </p>
                 </div>
                 
                 <div className="flex flex-col w-full md:w-auto gap-4">
                    <button 
                      onClick={() => document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })}
                      className={`group relative px-6 py-4 md:px-12 md:py-8 rounded-full flex items-center justify-between gap-4 md:gap-8 text-lg md:text-2xl font-black uppercase tracking-wider transition-all hover:scale-105 ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-cyan-400' : 'bg-slate-900 text-white hover:bg-cyan-500'
                      }`}
                    >
                       <span>Join Waitlist</span>
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-center text-sm font-bold opacity-50">LIMITED SPOTS AVAILABLE</p>
                 </div>
              </div>
            </div>

          </div>
        ) : type === 'growth' ? (
          <div className="mb-24 space-y-24">
            
            {/* 2. Scenario Cards (Growth Version - Editorial Style) */}
            <div className="py-12">
              <div className="mb-24 border-b-2 pb-12 border-slate-200 dark:border-white/10">
                 <div className="flex flex-col gap-8">
                   <h3 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('p2.hero.tagline')}
                   </h3>
                   <div className="max-w-4xl pb-2">
                      <div className="h-2 w-24 bg-purple-500 mb-6"></div>
                      <p className={`text-xl md:text-2xl font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {t('p2.hero.intro')}
                      </p>
                   </div>
                 </div>
              </div>

              <div className="space-y-12 md:space-y-16">
                {[
                  { 
                    id: '01',
                    eng: t('p2.s1.eng'),
                    title: t('p2.s1.title'), 
                    desc: t('p2.s1.desc'),
                    img: imgGrowthTime,
                    imgTitle: t('p2.s1.imgTitle'),
                    imgSub: t('p2.s1.imgSub')
                  },
                  { 
                    id: '02',
                    eng: t('p2.s2.eng'),
                    title: t('p2.s2.title'), 
                    desc: t('p2.s2.desc'),
                    img: imgGrowthSc2New,
                    imgTitle: t('p2.s2.imgTitle'),
                    imgSub: t('p2.s2.imgSub')
                  },
                  { 
                    id: '03',
                    eng: t('p2.s3.eng'),
                    title: t('p2.s3.title'), 
                    desc: t('p2.s3.desc'),
                    img: imgGrowthSc3New,
                    imgTitle: t('p2.s3.imgTitle'),
                    imgSub: t('p2.s3.imgSub')
                  },
                  { 
                    id: '04',
                    eng: t('p2.s4.eng'),
                    title: t('p2.s4.title'), 
                    desc: t('p2.s4.desc'),
                    img: imgGrowthSc4New,
                    imgTitle: t('p2.s4.imgTitle'),
                    imgSub: t('p2.s4.imgSub')
                  },
                  { 
                    id: '05',
                    eng: t('p2.s5.eng'),
                    title: t('p2.s5.title'), 
                    desc: t('p2.s5.desc'),
                    img: imgGrowthSc5New,
                    imgTitle: t('p2.s5.imgTitle'),
                    imgSub: t('p2.s5.imgSub')
                  }
                ].map((item, i) => (
                   <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 md:gap-8 group`}>
                      
                      {/* Image Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[65%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         <div className={`relative w-full h-[350px] md:h-[400px] md:group-hover:h-[500px] rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group/image ${theme === 'dark' ? 'border-white/10' : `border-purple-500`}`}>
                            <img 
                                src={item.img} 
                                alt={item.title} 
                                className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110`} 
                            />
                            
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-500 ${
                                (item.id === '02' || item.id === '03') 
                                    ? 'bg-gradient-to-b from-black/90 via-black/30 to-transparent' 
                                    : 'bg-gradient-to-t from-black/90 via-black/30 to-transparent'
                            }`} />

                            {/* Text Overlay */}
                            <div className={`absolute w-full p-8 z-20 text-white transition-transform duration-500 ${
                                (item.id === '02' || item.id === '03')
                                    ? 'top-0 left-0 -translate-y-4 group-hover/image:translate-y-0'
                                    : 'bottom-0 left-0 translate-y-4 group-hover/image:translate-y-0'
                            }`}>
                               <div className="flex items-center gap-2 mb-3">
                                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Scn. {item.id}</span>
                               </div>
                               <h4 className="text-2xl md:text-3xl font-black mb-3 leading-tight shadow-sm">{item.imgTitle}</h4>
                               <p className="text-sm md:text-base font-medium text-white/90 line-clamp-2 group-hover/image:line-clamp-none transition-all leading-relaxed max-w-lg">
                                 {item.imgSub}
                               </p>
                            </div>
                         </div>
                      </div>

                      {/* Text Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[30%] relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         {/* Background Number */}
                         <span className={`absolute -top-20 -left-10 text-[12rem] leading-none font-black select-none pointer-events-none ${theme === 'dark' ? 'text-white opacity-10' : 'text-slate-900 opacity-5'}`}>
                            {item.id}
                         </span>
                         
                         <div className={`relative pt-10 pl-4 transition-transform duration-700 md:group-hover:scale-90 ${i % 2 === 0 ? 'origin-left' : 'origin-right'}`}>
                            <div className="flex items-center gap-4 mb-4">
                               <div className="h-1 w-12 bg-purple-500"></div>
                               <h4 className="text-purple-500 font-black uppercase tracking-widest text-lg">{item.eng}</h4>
                            </div>
                            
                            <h3 className={`text-4xl md:text-5xl font-black leading-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                               {item.title}
                            </h3>
                            
                            {/* Description Restored */}
                            <p className={`text-sm font-medium leading-relaxed line-clamp-3 ${
                               theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
                            }`}>
                               {item.desc}
                            </p>
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

             {/* 3. Feature Cards (Core Modules - Interactive Grid) */}
            <div className="mb-24">
              <div className="flex items-baseline justify-between mb-12 border-b pb-6">
                <h3 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t('detail.coreModules')}
                </h3>
                <span className="text-sm font-bold uppercase tracking-widest text-purple-500">System v2.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                {(() => {
                  const moduleType = 'growth';
                  const icons = [CheckCircle2, BookOpen, Mic, Clock, Smartphone];

                  const modules = [
                    {
                      id: 0,
                      title: t(`${moduleType}.core.0.title`),
                      tag: t(`${moduleType}.core.0.tag`),
                      desc: t(`${moduleType}.core.0.desc`),
                      icon: icons[0],
                      color: "purple"
                    },
                    {
                      id: 1,
                      title: t(`${moduleType}.core.1.title`),
                      tag: t(`${moduleType}.core.1.tag`),
                      desc: t(`${moduleType}.core.1.desc`),
                      icon: icons[1],
                      color: "cyan"
                    },
                    {
                      id: 2,
                      title: t(`${moduleType}.core.2.title`),
                      tag: t(`${moduleType}.core.2.tag`),
                      desc: t(`${moduleType}.core.2.desc`),
                      icon: icons[2],
                      color: "pink"
                    },
                    {
                      id: 3,
                      title: t(`${moduleType}.core.3.title`),
                      tag: t(`${moduleType}.core.3.tag`),
                      desc: t(`${moduleType}.core.3.desc`),
                      icon: icons[3],
                      color: "orange"
                    },
                    {
                      id: 4,
                      title: t(`${moduleType}.core.4.title`),
                      tag: t(`${moduleType}.core.4.tag`),
                      desc: t(`${moduleType}.core.4.desc`),
                      icon: icons[4],
                      color: "blue"
                    }
                  ];

                  const activeItem = modules[0];
                  const ActiveIcon = activeItem.icon;

                  return (
                    <>
                       {/* 1. Big Item (Left - Always Expanded) */}
                       <div className={`col-span-1 md:col-span-2 md:row-span-2 rounded-[2rem] p-8 md:p-12 border-2 flex flex-col justify-between relative overflow-hidden ${
                          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                       }`}>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                             <div>
                                <div className="flex justify-between items-start mb-6">
                                   <div className={`p-4 rounded-2xl bg-${activeItem.color}-500 text-white`}>
                                      <ActiveIcon className="w-10 h-10" />
                                   </div>
                                   <span className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest ${
                                      theme === 'dark' ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'
                                   }`}>
                                      {activeItem.tag}
                                   </span>
                                </div>
                                <h4 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                   {activeItem.title}
                                </h4>
                                <p className={`text-lg font-medium leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                   {activeItem.desc}
                                </p>
                             </div>
                             {/* UI Image Always Visible for Big Card */}
                             <div className="relative w-full h-64 mt-8 rounded-2xl overflow-hidden shadow-lg border border-black/5">
                                <img src={imgCoreUI} alt="UI Preview" className="w-full h-full object-cover" />
                             </div>
                          </div>
                       </div>

                       {/* 2. Small Items (Right Grid) */}
                       {modules.slice(1).map((item) => (
                          <div 
                             key={item.id} 
                             className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-6 border-2 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${
                               theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-white border-slate-200 hover:shadow-xl hover:border-slate-300'
                             }`}
                          >
                             {/* Hover Background Image (UI) */}
                             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                                <img src={imgCoreUI} alt="UI Preview" className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-t ${
                                   theme === 'dark' ? 'from-black/95 via-black/80 to-black/40' : 'from-white/95 via-white/80 to-white/40'
                                }`} />
                             </div>

                             <div className="relative z-10 flex flex-col h-full justify-between">
                                {/* Header: Icon Left, Tag Right */}
                                <div className="flex justify-between items-start mb-4">
                                   {/* Colored Icon */}
                                   <div className={`p-3 rounded-xl transition-colors ${
                                      theme === 'dark' 
                                        ? `bg-${item.color}-500/20 text-${item.color}-400` 
                                        : `bg-${item.color}-50 text-${item.color}-600`
                                   }`}>
                                      <item.icon className="w-6 h-6" />
                                   </div>
                                   
                                   {/* Colored Tag (Top Right) */}
                                   <span className={`text-[10px] font-black uppercase tracking-widest py-1 px-2 rounded-lg ${
                                      theme === 'dark' ? `text-${item.color}-400 bg-${item.color}-900/30` : `text-${item.color}-600 bg-${item.color}-50`
                                   }`}>
                                      {item.tag}
                                   </span>
                                </div>
                                
                                {/* Content: Title + Description */}
                                <div>
                                   <h4 className={`text-xl font-black leading-tight mb-3 ${
                                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                                   }`}>
                                      {item.title}
                                   </h4>
                                   
                                   {/* Description Restored */}
                                   <p className={`text-sm font-medium leading-relaxed line-clamp-3 ${
                                      theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
                                   }`}>
                                      {item.desc}
                                   </p>
                                </div>
                             </div>
                          </div>
                       ))}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 4. Trust & Safety (Growth Version - Same Layout as Early) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch border-t pt-12">
               <div className="flex flex-col justify-between h-full">
                  <div className="mb-8">
                    <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('growth.trust.title')}
                    </h3>
                    <p className={`text-lg font-medium max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('growth.trust.desc')}
                    </p>
                  </div>
                  
                  {/* Interactive Exploded View */}
                  <div className="relative w-full max-w-[140px] mx-auto aspect-[1/2]">
                     <img src={imgTrustGrowth} alt="Safety Anatomy" className="w-full h-full object-contain" />
                     
                     {/* SVG Overlay for Connecting Lines */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-50" viewBox="0 0 400 800">
                        <defs>
                           <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                 <feMergeNode in="coloredBlur"/>
                                 <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                           </filter>
                        </defs>

                        {/* 0: Camera (Top Right) */}
                        {activeSafety === 0 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="300" cy="100" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="300" cy="100" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 300 100 L 340 100 L 340 -320 L 1380 -320" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="-320" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 1: Local AI (Middle Board) */}
                        {activeSafety === 1 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="200" cy="400" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="200" cy="400" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 200 400 L 360 400 L 360 0 L 1380 0" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="0" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 2: Traceability (Bottom Memory) */}
                        {activeSafety === 2 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="250" cy="600" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="250" cy="600" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 250 600 L 380 600 L 380 320 L 1380 320" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="320" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}

                        {/* 3: Parent Control (Screen Front) */}
                        {activeSafety === 3 && (
                           <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <circle cx="150" cy="250" r="10" fill="#06b6d4" filter="url(#glow)" />
                              <circle cx="150" cy="250" r="18" stroke="#06b6d4" strokeWidth="4" fill="none" opacity="0.5">
                                 <animate attributeName="r" from="10" to="24" dur="1.5s" repeatCount="indefinite" />
                                 <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <motion.path 
                                 d="M 150 250 L 400 250 L 400 640 L 1380 640" 
                                 fill="none" 
                                 stroke="#06b6d4" 
                                 strokeWidth="10"
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 0.4 }}
                              />
                              <circle cx="1380" cy="640" r="10" fill="#06b6d4" />
                           </motion.g>
                        )}
                     </svg>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const tKey = `growth.trust.${idx}`;
                    const icons = [Camera, Cpu, BarChart3, Smartphone];
                    
                    return (
                      <div 
                        key={idx} 
                        onMouseEnter={() => setActiveSafety(idx)}
                        onMouseLeave={() => setActiveSafety(null)}
                        className={`group relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 cursor-default ${
                        theme === 'dark' 
                          ? (activeSafety === idx ? 'border-cyan-500 bg-white/10' : 'border-white/10 hover:border-white/30') 
                          : (activeSafety === idx ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-200 hover:border-cyan-200')
                      }`}>
                         {/* Active Indicator Line */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500 rounded-l-2xl transition-opacity duration-300 ${activeSafety === idx ? 'opacity-100' : 'opacity-0'}`} />
                         
                         <div>
                            <h5 className={`font-black uppercase tracking-wider transition-colors ${
                               activeSafety === idx ? 'text-cyan-600' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                            }`}>{t(`${tKey}.text`)}</h5>
                            <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${tKey}.sub`)}</p>
                         </div>
                         <div className={`p-3 rounded-full transition-all duration-300 ${
                            activeSafety === idx ? 'bg-cyan-500 text-white scale-110' : (theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400')
                         }`}>
                            {React.createElement(icons[idx], { className: "w-5 h-5" })}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* 5. Bottom CTA (Huge Typography) */}
            <div className={`py-24 md:py-32 border-y-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
              <div className="flex flex-col md:flex-row items-end justify-between gap-12">
                 <div>
                    <h2 className={`text-6xl md:text-9xl font-black tracking-tighter leading-none mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      立即开始
                    </h2>
                    <p className={`text-xl md:text-2xl font-bold max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Baseul 成长版不教孩子多做 而是教他们怎么做<br/>
                      认知组织力从这里开始建立
                    </p>
                 </div>
                 
                 <div className="flex flex-col w-full md:w-auto gap-4">
                    <button 
                      onClick={() => document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })}
                      className={`group relative px-6 py-4 md:px-12 md:py-8 rounded-full flex items-center justify-between gap-4 md:gap-8 text-lg md:text-2xl font-black uppercase tracking-wider transition-all hover:scale-105 ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-purple-400' : 'bg-slate-900 text-white hover:bg-purple-500'
                      }`}
                    >
                       <span>Join Waitlist</span>
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-center text-sm font-bold opacity-50">LIMITED SPOTS AVAILABLE</p>
                 </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="mb-24 space-y-24">
            
            {/* 3. Scenario Cards (Explore Version) */}
            <div className="py-12">
              <div className="mb-24 border-b-2 pb-12 border-slate-200 dark:border-white/10">
                 <div className="flex flex-col gap-8">
                   <h3 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('p3.hero.tagline')}
                   </h3>
                   <div className="max-w-4xl pb-2">
                      <div className="h-2 w-24 bg-orange-500 mb-6"></div>
                      <p className={`text-xl md:text-2xl font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        Baseul 探索版是一台成长中枢，帮助���子梳理目标、拆解路径、复盘执行，进入系统化自我学习阶段。
                      </p>
                   </div>
                 </div>
              </div>

              <div className="space-y-12 md:space-y-16">
                {[
                  { 
                    id: '01',
                    eng: 'WEEKLY GOALS',
                    title: t('p3.sc.1.title'), 
                    desc: t('p3.sc.1.desc'),
                    img: theme === 'dark' ? imgExploreSc1Night : imgExploreSc1Day
                  },
                  { 
                    id: '02',
                    eng: 'PROJECT BREAKDOWN',
                    title: t('p3.sc.2.title'), 
                    desc: t('p3.sc.2.desc'),
                    img: 'https://images.unsplash.com/photo-1572855738753-2ada1199bb4d?auto=format&fit=crop&w=1200&q=80'
                  },
                  { 
                    id: '03',
                    eng: 'SYSTEM REVIEW',
                    title: t('p3.sc.3.title'), 
                    desc: t('p3.sc.3.desc'),
                    img: 'https://images.unsplash.com/photo-1588660500261-47058e961fa6?auto=format&fit=crop&w=1200&q=80'
                  },
                  { 
                    id: '04',
                    eng: 'RESOURCE GATHERING',
                    title: t('p3.sc.4.title'), 
                    desc: t('p3.sc.4.desc'),
                    img: 'https://images.unsplash.com/photo-1588618319407-948d4424befd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbGlicmFyeSUyMHJlc2VhcmNoaW5nJTIwYm9va3N8ZW58MXx8fHwxNzY0MDE2OTUxfDA&ixlib=rb-4.1.0&q=80&w=1080'
                  },
                  { 
                    id: '05',
                    eng: 'PEER SYNC',
                    title: t('p3.sc.5.title'), 
                    desc: t('p3.sc.5.desc'),
                    img: 'https://images.unsplash.com/photo-1557734864-c78b6dfef1b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwZGlzY3Vzc2luZyUyMHByb2plY3QlMjB0ZWFtd29yayUyMHNjaG9vbHxlbnwxfHx8fDE3NjQwMTY5NTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
                  }
                ].map((item, i) => (
                   <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 md:gap-8 group`}>
                      
                      {/* Image Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[65%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         <div className={`relative w-full h-[350px] md:h-[400px] md:group-hover:h-[500px] rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            {/* Tech Badge */}
                            <div className="absolute bottom-8 left-8 px-6 py-3 bg-black/80 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest rounded-full border border-white/20 z-10">
                               Scn. {item.id}
                            </div>
                         </div>
                      </div>

                      {/* Text Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[30%] relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         {/* Background Number */}
                         <span className={`absolute -top-20 -left-10 text-[12rem] leading-none font-black select-none pointer-events-none ${theme === 'dark' ? 'text-white opacity-10' : 'text-slate-900 opacity-5'}`}>
                            {item.id}
                         </span>
                         
                         <div className={`relative pt-10 pl-4 transition-transform duration-700 md:group-hover:scale-90 ${i % 2 === 0 ? 'origin-left' : 'origin-right'}`}>
                            <div className="flex items-center gap-4 mb-4">
                               <div className="h-1 w-12 bg-orange-500"></div>
                               <h4 className="text-orange-500 font-black uppercase tracking-widest text-lg">{item.eng}</h4>
                            </div>
                            
                            <h3 className={`text-4xl md:text-6xl font-black leading-tight mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                               {item.title}
                            </h3>
                            
                            <p className={`text-xl font-medium leading-relaxed max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                               {item.desc}
                            </p>
                         </div>
                      </div>

                   </div>
                ))}
              </div>
            </div>

            {/* 3. Feature Cards (Bento Grid) */}
            <div>
              <div className="flex items-baseline justify-between mb-12 border-b pb-6">
                <h3 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  核心模块
                </h3>
                <span className="text-sm font-bold uppercase tracking-widest text-orange-500">System v3.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                
                {/* 1. Goal Engine (Big) */}
                <div className={`col-span-1 md:col-span-2 md:row-span-2 rounded-[2rem] p-8 md:p-12 border-2 flex flex-col justify-between group hover:border-orange-400 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex justify-between items-start">
                      <div className="p-4 rounded-2xl bg-orange-500 text-white">
                        <Target className="w-10 h-10" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest opacity-50">01</span>
                   </div>
                   <div>
                      <h4 className={`text-3xl md:text-5xl font-black mb-4 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        GOAL<br/>ENGINE
                      </h4>
                      <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        每周/每月可设定成长任务 自动生成推进路径
                      </p>
                   </div>
                </div>

                {/* 2. Review Helper (Small) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-orange-500 hover:border-orange-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Check className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>任务复盘助手</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Review Helper</p>
                   </div>
                </div>

                {/* 3. Growth Map (Small) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-cyan-500 hover:border-cyan-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Activity className="w-8 h-8 text-cyan-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>成长地图</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Growth Map</p>
                   </div>
                </div>

                {/* 4. Creation Engine (Wide) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-pink-500 hover:border-pink-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Zap className="w-8 h-8 text-pink-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>创作输出引擎</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Creation Engine</p>
                   </div>
                </div>

                 {/* 5. Self-Drive Score (Wide) */}
                 <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-purple-500 hover:border-purple-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Award className="w-8 h-8 text-purple-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>自驱能力评分</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Self-Drive Score</p>
                   </div>
                </div>

              </div>
            </div>

            {/* 4. Trust & Safety (List Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start border-t pt-12">
               <div>
                  <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    信任与规范
                  </h3>
                  <p className={`text-lg font-medium max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    探索���不仅是工具，更是规范。我们建立了一套完整的数字生活礼仪。
                  </p>
               </div>
               <div className="space-y-4">
                  {[
                    { text: '本地处理', sub: '本地处理+任务可导出', icon: HardDrive },
                    { text: 'PARENT ACCESS', sub: '家长可读权限 · 适度���督', icon: Eye },
                    { text: '成长评分', sub: '多维成长评分 · 科学反馈', icon: BarChart3 },
                    { text: '隐私锁', sub: '可加物理隐私锁 · 默认学习优先', icon: Lock },
                  ].map((item, i) => (
                    <div key={i} className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all hover:pl-8 ${
                      theme === 'dark' 
                        ? 'border-white/10 hover:bg-white/10 hover:border-white/20' 
                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-900'
                    }`}>
                       <div>
                          <h5 className={`font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.text}</h5>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</p>
                       </div>
                       <item.icon className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                    </div>
                  ))}
               </div>
            </div>

            {/* 5. Bottom CTA (Huge Typography) */}
            <div className={`py-24 md:py-32 border-y-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
              <div className="flex flex-col md:flex-row items-end justify-between gap-12">
                 <div>
                    <h2 className={`text-6xl md:text-9xl font-black tracking-tighter leading-none mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      立即开始
                    </h2>
                    <p className={`text-xl md:text-2xl font-bold max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      能自驱的孩子 不需要被监督<br/>
                      从9岁开始 建立一套属于自己的操作系统
                    </p>
                 </div>
                 
                 <div className="flex flex-col w-full md:w-auto gap-4">
                    <button 
                      onClick={() => document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })}
                      className={`group relative px-6 py-4 md:px-12 md:py-8 rounded-full flex items-center justify-between gap-4 md:gap-8 text-lg md:text-2xl font-black uppercase tracking-wider transition-all hover:scale-105 ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-orange-400' : 'bg-slate-900 text-white hover:bg-orange-500'
                      }`}
                    >
                       <span>了解更多</span>
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button className={`text-sm font-bold uppercase tracking-widest hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                       预约首发
                    </button>
                 </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
