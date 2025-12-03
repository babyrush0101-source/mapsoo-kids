import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigation, Region } from './navigation-context';

interface LanguageContextType {
  region: Region;
  language: string; // Language code for compatibility
  setRegion: (region: Region) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const commonUS = {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.philosophy': 'Philosophy',
    'nav.blog': 'Blog',
    'nav.login': 'Login',
    'nav.getStarted': 'Get Started',
    'nav.joinList': 'Join List',
    'nav.joinShort': 'Join',
    'nav.language': 'Language',
    'nav.productsTitle': 'Products',
    
    'hero.title.line1': 'COGNITIVE OS',
    'hero.title.line2': 'FOR AI NATIVES',
    'hero.eyebrow': 'Baseul Kids · AI Learning System',
    'hero.subtitle': 'Replace restrictions with norms. Baseul Kids uses AI to turn Rhythm, Tasks, and Review into a cognitive foundation. Building steadier habits, faster absorption, and continuous upgrades in self-drive and creativity.',
    'hero.badge': 'The Cognitive System',
    'hero.explore': 'Explore System',
    'hero.cta.waitlist': 'Join Waitlist',
    'hero.cta.join': 'Join Now',
    'hero.cta.getStarted': 'Get Started',
    'hero.cta.partner': 'Become a Partner',

    'waitlist.title': 'Join the Waitlist',
    'waitlist.desc': 'Please enter your contact details.',
    'waitlist.input.cn': 'Phone number or WeChat ID',
    'waitlist.input.en': 'Email address',
    'waitlist.submit': 'Join',

    'partner.page.title': 'Partner with Baseul',
    'partner.page.desc': 'Join us in building the cognitive operating system for the next generation.',
    'partner.tab.team': 'Join Team',
    'partner.tab.distributor': 'Distributor',
    'partner.form.role': 'Select Position',
    'partner.role.dev': 'Developer',
    'partner.role.design': 'Designer',
    'partner.role.brand': 'Brand / Marketing',
    'partner.role.other': 'Other',
    'partner.form.exp': 'Tell us about yourself',
    'partner.form.contact': 'Phone or Email',
    'partner.form.region': 'Your Region',
    'partner.form.submit': 'Submit Application',

    'video.title.line1': 'Building',
    'video.title.line2': 'Cognitive Structures',
    'video.description': 'Start with habits and interests. Accelerate understanding. Move towards self-drive and creation. Grow in sync with the era.',
    'video.button': 'Our Philosophy',

    'products.badge': '3 Stages × 3 Forms',
    'products.title': 'The Cognitive Trilogy',
    'products.subtitle': 'A complete growth system evolving with your child\'s cognitive development.',
    
    'p1.title': 'Baseul Kids · Early',
    'p1.age': '3-6 Years',
    'p1.desc': 'Cognitive Establishment. A wearable AI companion that turns daily habits into rhythm and order.',
    'p1.tag': 'Rhythm & Habits',
    'p1.name': 'Early (3-6)',

    'p2.title': 'Baseul Kids · Growth',
    'p2.age': '6-9 Years',
    'p2.desc': 'Cognitive Organization. A desktop partner that transforms tasks into structured paths.',
    'p2.tag': 'Tasks & Focus',
    'p2.name': 'Growth (6-9)',

    'p3.title': 'Baseul Kids · Explore',
    'p3.age': '9+ Years',
    'p3.desc': 'Cognitive Leadership. A dedicated terminal for system planning and self-driven growth.',
    'p3.tag': 'System & Strategy',
    'p3.name': 'Explore (9+)',

    'p4.title': 'Baseul Memory',
    'p4.age': 'All Ages',
    'p4.desc': 'The Cognitive Core. A private light NAS that records every milestone and question.',
    'p4.tag': 'Growth & History',
    'p4.name': 'Baseul Memory',

    'home.memory.title': 'Baseul Memory',
    'home.memory.subtitle': 'The Cognitive Core',
    'home.memory.desc': 'A dedicated light NAS that records every interaction, question, and milestone. It forms your child\'s personal growth history and knowledge base, allowing AI to grow with them.',
    'home.memory.benefit': 'As they grow, their cognitive, learning, and creative abilities will surpass peers through accumulated data.',
    'home.memory.cta': 'View Baseul Memory',

    'info.s1.title.line1': 'Habits as',
    'info.s1.title.line2': 'Growth Rooms',
    'info.s1.desc': 'Every action—brushing teeth, expressing emotions—is modeled as a complete "Room". It\'s not just feedback; it\'s a structural loop of start, process, and achievement.',
    'info.s1.button': 'See How It Works',
    'info.s1.vision': 'Structure',
    
    'info.s2.title.line1': 'Data Sovereignty',
    'info.s2.title.line2': '& Privacy',
    'info.s2.desc': 'Your child\'s growth data belongs to them. Local AI processing ensures privacy while building a lifelong cognitive map.',
    'info.s2.list1': 'Local AI Processing',
    'info.s2.list2': 'No Ads / No Addiction',
    'info.s2.list3': 'Parent-Child Data Sync',
    'info.s2.quote': 'Not a device, but a part of their destiny structure.',

    'info.manifesto.badge': 'Our Philosophy',
    'info.manifesto.title.1': 'Not just smart toys.',
    'info.manifesto.title.2': 'Cognitive Architecture.',
    'info.manifesto.desc': 'Most educational tech focuses on content consumption. We focus on structure creation. Baseul Kids devices act as an external cortex, helping children visualize time, organize tasks, and regulate emotions until these skills are internalized.',
    'info.manifesto.button': 'Read the Manifesto',
    
    'info.feat.1.title': 'Cognitive Mapping',
    'info.feat.1.desc': 'AI tracks developmental milestones and adapts challenges.',
    'info.feat.2.title': 'Rhythm Engines',
    'info.feat.2.desc': 'Turning daily routines into predictable, comforting loops.',
    'info.feat.3.title': 'Data Sovereignty',
    'info.feat.3.desc': 'Local-first processing. No voice data ever leaves the device.',
    'info.feat.4.title': 'Emotional AI',
    'info.feat.4.desc': 'Responds to tone and stress levels with calming interventions.',
    'info.feat.5.title': 'Family Sync',
    'info.feat.5.desc': 'Aligns the whole family on the same schedule and goals.',
    'info.feat.6.title': 'Focus Flow',
    'info.feat.6.desc': 'Distraction-blocking technology for deep work sessions.',

    'testimonials.title': 'Cognitive Impact',
    'testimonials.subtitle': 'Parents seeing real changes in rhythm and autonomy.',
    
    'testi.1.content': "The 'Early' device completely changed our morning routine. My 4-year-old actually enjoys brushing his teeth now because he wants to complete the 'loop'.",
    'testi.1.name': "Sarah Jenkins",
    'testi.1.role': "Mother of two (4 & 7)",
    
    'testi.2.content': "Finally, technology that reduces anxiety instead of creating it. The focus on 'structure over stimulation' is exactly what this generation needs.",
    'testi.2.name': "Dr. Aris Thorne",
    'testi.2.role': "Child Psychologist",
    
    'testi.3.content': "I've tested dozens of 'smart' toys. Baseul isn't a toy. It's a beautiful, calm operating system for a child's life. The hardware quality is unmatched.",
    'testi.3.name': "Michelle Wu",
    'testi.3.role': "Education Tech Lead",
    
    'testi.4.content': "My daughter loves the 'Explore' kit. It's helped her understand coding concepts without being glued to a screen all day.",
    'testi.4.name': "James Chen",
    'testi.4.role': "Father of 9-year-old",
    
    'testi.5.content': "The most intuitive learning system we've used. It adapts perfectly as they grow. Highly recommended!",
    'testi.5.name': "Emily Ross",
    'testi.5.role': "Homeschooling Mom",
    
    'testi.6.content': "Design is stellar. It looks good in our living room, unlike most plastic kids' tech. Functionality is even better.",
    'testi.6.name': "David Kim",
    'testi.6.role': "Architect",

    'blog.badge': 'System Updates',
    'blog.title': 'Growth Logs',
    'blog.viewAll': 'View All',
    'blog.post1.title': 'Why We Need a "Cognitive Operating System"',
    'blog.post1.desc': 'In the AI era, the ability to collaborate with intelligence matters more than knowledge.',
    'blog.post1.read': 'Read Logic',
    'blog.post2.title': 'How "Rooms" Build Habits',
    'blog.post3.title': 'The End of Screen Addiction',
    'blog.tag.coding': 'Cognition',
    'blog.tag.robotics': 'System',
    'blog.tag.health': 'Privacy',
    'blog.post2.title': 'How to Build Order with "Room" Theory',
    'blog.post3.title': 'End Algorithm Addiction: Reclaiming Attention',

    // Trilogy Cards (Home)
    'trilogy.card1.title': 'Happiness comes from Cognitive Establishment',
    'trilogy.card1.name': 'Baseul Kids · Early',
    'trilogy.card1.benefit': 'Structure brushing, tidying, and bedtime stories into small tasks. Children finish with a smile, parents nag less.',
    'trilogy.card1.desc': 'Embedded AI emotional companion. Understanding child rhythm, structuring daily habits. Not just a toy, but a behavior organizer.',
    'trilogy.card1.sub': 'Rhythm Building × Habit Formation',
    'trilogy.card1.cta': 'Explore Early',
    'trilogy.card1.badge': 'Early 3–6',

    'trilogy.card2.title': 'Progress comes from Cognitive Organization',
    'trilogy.card2.name': 'Baseul Kids · Growth',
    'trilogy.card2.benefit': 'Break homework into steps, connect knowledge to meaning. Absorb faster, understand deeper, see progress daily.',
    'trilogy.card2.desc': 'Desktop AI study companion. Deconstructs tasks, arranges rhythm. Evolves from reminder to guide, building the "Goal-Feedback" loop.',
    'trilogy.card2.sub': 'Task Scheduling × Focus',
    'trilogy.card2.cta': 'Explore Growth',
    'trilogy.card2.badge': 'Growth 6–9',

    'trilogy.card3.title': 'Achievement comes from Cognitive Leadership',
    'trilogy.card3.name': 'Baseul Kids · Explore',
    'trilogy.card3.benefit': 'Self-plan, self-advance, self-review with a closed loop of Goal-Path-Review. Learning how to learn.',
    'trilogy.card3.desc': 'Foldable AI Cognitive Terminal. The first "Growth Hub". No entertainment distractions, focused on goal planning, path recommendation, and self-optimization.',
    'trilogy.card3.sub': 'System Planning × Self-Drive',
    'trilogy.card3.cta': 'Explore System',
    'trilogy.card3.badge': 'Explore 9+',

    'trilogy.card4.title': 'Family Cognitive Hub',
    'trilogy.card4.name': 'Baseul Memory',
    'trilogy.card4.benefit': 'Record Growth, Store Knowledge, Connect Future',
    'trilogy.card4.desc': 'A private light NAS recording every question and answer, forming the child\'s own growth history and knowledge base.',
    'trilogy.card4.sub': 'Growth Record × Knowledge Base',
    'trilogy.card4.cta': 'View Baseul Memory',
    
    // Early Bento
    'p1.bento.1.title': 'RHYTHM\nENGINE',
    'p1.bento.1.desc': 'Automatically prompts time points based on routine. Security in rhythm.',
    'p1.bento.2.title': 'MINI TASKS',
    'p1.bento.2.sub': 'Structured Steps · Positive Feedback',
    'p1.bento.3.title': 'EMOTIONAL AI',
    'p1.bento.3.sub': 'Identify Tones · Gentle Response',
    'p1.bento.4.title': 'PHOTO LEARNING',
    'p1.bento.4.sub': 'Point & Learn · Active Curiosity',
    'p1.bento.5.title': 'PARENT SYNC',
    'p1.bento.5.sub': 'Non-intrusive Company',
    'detail.cta.early.desc': 'Children do not lack cooperation, they lack structural guidance. Now is the best starting point.',

    // Early Scenarios (Detailed)
    'p1.s1.eng': 'Perceptual Cognition',
    'p1.s1.title': 'Visual AI × Polyglot Guide',
    'p1.s1.desc': 'Built-in camera recognition + voice module. Instantly identifies objects and narrates in multiple languages (EN/CN/JP), switchable via App.',
    'p1.s1.imgTitle': 'Snap to Understand the World',
    'p1.s1.imgSub': 'Point at anything, and AI explains it. Spark curiosity and vocabulary growth with instant, multilingual feedback.',

    'p1.s2.eng': 'Contextual Cognition',
    'p1.s2.title': 'NFC Pals × Interactive Play',
    'p1.s2.desc': 'Each plushie has a unique identity chip. The device loads exclusive content modes (Roleplay, Story Theater) instantly upon contact.',
    'p1.s2.imgTitle': 'New Friend, New World',
    'p1.s2.imgSub': 'NFC technology unlocks specific interaction modes—stories, games, Q&A—letting children build cognition through role-playing.',

    'p1.s3.eng': 'Executive Cognition',
    'p1.s3.title': 'Adaptive Tasks × Rhythm Guide',
    'p1.s3.desc': 'Dynamically generates rhythmic tasks based on interests and growth stage. Guides the child to build confidence and life rhythms step-by-step.',
    'p1.s3.imgTitle': 'From "I Can\'t" to "I Did It!"',
    'p1.s3.imgSub': 'Daily routines (brushing, tidying) are broken down into small steps. Completion triggers light rewards, building confidence through positive loops.',

    'p1.s4.eng': 'Emotional Cognition',
    'p1.s4.title': 'Smart Log × Peace of Mind',
    'p1.s4.desc': 'Automatically logs ambient audio/video in daycare settings. Detects abnormal crying patterns and alerts parents instantly, ensuring safety and care.',
    'p1.s4.imgTitle': 'Away, Yet Aware',
    'p1.s4.imgSub': 'Scheduled snapshots and cry detection help you review key moments, understanding your child\'s emotional state even when you\'re not there.',

    'p1.s5.eng': 'Meta-Cognition',
    'p1.s5.title': 'App Sync × Parenting Insights',
    'p1.s5.desc': 'Analyzes interaction data and voice keywords to generate weekly reports. Adjust task intensity and rhythm distribution with a single tap.',
    'p1.s5.imgTitle': 'Not Surveillance, But Synergy',
    'p1.s5.imgSub': 'View task completion, interest keywords, and voice logs. Get personalized parenting advice to reduce anxiety and improve quality time.',

    // Growth Bento
    'p2.bento.1.title': 'TASK BREAKER',
    'p2.bento.1.desc': 'Structure complex tasks into executable steps. Improve focus and completion rate.',
    'p2.bento.2.title': 'Review Lite',
    'p2.bento.3.title': 'Voice Companion',
    'p2.bento.4.title': 'Self-Drive Score',

    // Explore Bento (Placeholder keys)
    'p3.bento.1.title': 'SYSTEM OS',
    'p3.bento.1.desc': 'Dedicated operating system for goal planning and knowledge management.',

    'footer.title.line1': 'DESIGN THE',
    'footer.title.line2': 'MINDSET',
    'footer.subscribe.placeholder': 'Join the waitlist',
    'footer.subscribe.button': 'Join',
    'footer.copyright': '© 2025 Baseul Kids. Cognitive Operating System.',
    
    // Product Detail UI
    'detail.coreModules': 'CORE MODULES',
    'detail.safetyFirst': 'SAFETY FIRST',
    'detail.trustNorms': 'TRUST & NORMS',
    'detail.startNow': 'START NOW',
    'detail.limitedSpots': 'LIMITED SPOTS AVAILABLE',
    'detail.joinWaitlist': 'Join Waitlist',
    'detail.viewSpecs': 'View Tech Specs',
    'detail.bindDevice': 'Bind Existing Device',
    'detail.saveHistory': 'SAVE HISTORY',
    'detail.saveHistoryDesc': 'Start saving your child\'s cognitive history today. The best gift for their future.',
    'detail.safety.desc': 'We know safety is the first priority. Baseul protects from physical material to data privacy.',
    'detail.safety.material': 'FOOD GRADE MATERIAL',
    'detail.safety.materialSub': 'Skin-friendly silicone, waterproof & mute design',
    'detail.safety.eye': 'EYE PROTECTION',
    'detail.safety.eyeSub': 'Low blue light, no ads, designed for vision health',
    'detail.safety.control': 'PARENT CONTROL',
    'detail.safety.controlSub': 'Set usage times & content via App',
    'detail.safety.memory': 'LIFE MOMENTS MEMORY',
    'detail.safety.memorySub': 'Local recording of interactions & growth milestones',
    'detail.safety.noCamera': 'NO CAMERA',
    'detail.safety.noCameraSub': 'Privacy First',
    'detail.safety.local': 'LOCAL ANALYSIS',
    'detail.safety.localSub': 'No Data Upload',
    'detail.safety.export': 'EXPORT DATA',
    'detail.safety.exportSub': 'You own the data',
    'detail.safety.parent': 'PARENT CONTROL',
    'detail.safety.parentSub': 'No Ads',

    // Product Feature Lists
    'p1.list.1': 'Habit Loops: Brushing, Sleeping, Tidying',
    'p1.list.2': 'Screen-free Voice Interaction',
    'p1.list.3': 'Soft Silicone & Plushie Compatible',
    'p1.list.4': 'Emotional Response System',
    'p1.list.5': 'Parent-Child Data Sync',
    'p2.list.1': 'Task Breakdown Engine',
    'p2.list.2': 'Posture Monitoring Camera',
    'p2.list.3': 'Focus Timer & Breaks',
    'p2.list.4': 'Desktop & Wearable Mode',
    'p2.list.5': 'Homework Helper AI',
    'p3.list.1': 'Project Management',
    'p3.list.2': 'System Thinking',
    'p3.list.3': 'Goal Tracking',
    'p3.list.4': 'Self-Correction',
    'p3.list.5': 'Cloud Sync',

    // Scenarios (Hero Cards)
    'p1.sc.1.title': 'Morning Shine',
    'p1.sc.1.desc': 'Gentle light wakes the child, guiding them through brushing teeth with a song.',
    'p1.sc.2.title': 'Play & Learn',
    'p1.sc.2.desc': 'Interactive storytelling without screens, fostering imagination.',
    'p1.sc.3.title': 'Dream Mode',
    'p1.sc.3.desc': 'Soft lullabies and night light to establish healthy sleep patterns.',
    'p1.sc.4.title': 'Object Recognition',
    'p1.sc.4.desc': 'Point the device to learn names and facts about objects, sparking active curiosity.',
    'p1.sc.5.title': 'Parent Sync',
    'p1.sc.5.desc': 'Set rhythm and view interests via App without intrusive hovering.',
    'p2.s1.eng': 'TASK COGNITION',
    'p2.s1.title': 'Not Just Answers, But a Guide to Solving',
    'p2.s1.desc': 'Deconstructs problems step-by-step and monitors posture. Helps build focus and healthy habits.',
    'p2.s1.imgTitle': 'AI Homework Companion',
    'p2.s1.imgSub': 'Step-by-step guidance + Posture correction.',
    
    'p2.s2.eng': 'INTEREST COGNITION',
    'p2.s2.title': 'One AI Device, Many Interest Tutors',
    'p2.s2.desc': 'Switch between English, Art, Coding agents. Sparks creativity and saves on tuition anxiety.',
    'p2.s2.imgTitle': 'Multi-Interest AI',
    'p2.s2.imgSub': 'English practice / Creative Arts / Coding games.',

    'p2.s3.eng': 'SOCIAL COGNITION',
    'p2.s3.title': 'Learning Together, Connecting with a Touch',
    'p2.s3.desc': 'NFC touch to add friends. Participate in study groups to build social boundaries and cooperation.',
    'p2.s3.imgTitle': 'Social Touch & Sync',
    'p2.s3.imgSub': 'Study groups / Interest circles / Safe interaction.',

    'p2.s4.eng': 'TIME COGNITION',
    'p2.s4.title': 'Teaching Time Management, Not Just Reminders',
    'p2.s4.desc': 'Personalized rhythm plans. Auto-review mistakes and track progress with closed-loop incentives.',
    'p2.s4.imgTitle': 'Smart Rhythm Engine',
    'p2.s4.imgSub': 'Planning / Review / Closed-loop incentives.',

    'p2.s5.eng': 'META-COGNITION',
    'p2.s5.title': 'Not Surveillance, But Seeing Growth',
    'p2.s5.desc': 'App generates reports on interests and tasks. Offers personalized advice for collaborative parenting.',
    'p2.s5.imgTitle': 'Parent App Insight',
    'p2.s5.imgSub': 'Growth analysis / Smart suggestions / Synergy.',
    'p3.sc.1.title': 'Self-Planning',
    'p3.sc.1.desc': 'Setting weekly goals and breaking them down autonomously.',
    'p3.sc.2.title': 'Deep Work',
    'p3.sc.2.desc': 'Long sessions of coding or writing with zero distractions.',
    'p3.sc.3.title': 'System Review',
    'p3.sc.3.desc': 'Weekly analysis of productivity and focus patterns.',
    'p3.sc.4.title': 'Resource Gathering',
    'p3.sc.4.desc': 'Collecting and organizing information for projects.',
    'p3.sc.5.title': 'Peer Sync',
    'p3.sc.5.desc': 'Collaborating with friends on shared goals.',
    
    // Product Detail Page Content
    'p1.hero.tagline': 'Grow Happily in Rhythm',
    'p1.hero.intro': '3-6 years is the key window for cognitive habits and emotional regulation. Baseul Early helps structure daily tasks, building a sense of order and achievement.',
    'p2.hero.tagline': 'Give Tasks a Path, Make Progress Visible',
    'p2.hero.intro': 'Baseul Growth Edition transforms abstract tasks into clear steps. From homework to hobbies, it helps children build the "Goal-Feedback" loop.',
    'p3.hero.tagline': 'From Managed to Self-Driven',
    'p3.hero.intro': 'Baseul Explore Edition is the command center for the older child. It shifts focus from "doing what is told" to "planning what to do".',
    'memory.hero.tagline': 'Child Growth Should Not Be Just For Today',
    'memory.sc.1.title': 'Voice History & Self-Recognition',
    'memory.sc.1.desc': 'Every question asked and emotion expressed is recorded in their growth timeline.',
    'memory.sc.2.title': 'Generative Growth Profile',
    'memory.sc.2.desc': 'System generates learning tracks, interest graphs, and vocabulary trees.',
    'memory.sc.3.title': 'Parent Link & Company',
    'memory.sc.3.desc': 'Regular growth summaries for parents to connect with real educational resonance.',
    'memory.sc.4.title': 'Evolving AI Model',
    'memory.sc.4.desc': 'The system adapts to growth feedback for truly personalized companionship.',
    'memory.sc.5.title': 'Smart Suggestions',
    'memory.sc.5.desc': 'Personalized content and challenge recommendations based on interests and ability.',
    'memory.sc.6.title': 'Precision Engineering',
    'memory.sc.6.desc': 'High-performance local computing core with modular expansion capabilities.',
    
    // Specs
    'spec.battery': 'Battery', 'spec.material': 'Material', 'spec.aicore': 'AI Core',
    'spec.display': 'Display', 'spec.camera': 'Camera', 'spec.mode': 'Mode',
    'spec.screen': 'Screen', 'spec.input': 'Input', 'spec.security': 'Security',

    // Product Details - UI & Values
    'detail.back': 'Back to System',
    'detail.addToOrder': 'Add to order',
    'detail.bundle.title': 'Bundle with Baseul Memory',
    'detail.bundle.desc': 'Securely store your child\'s growth data forever. Local-first NAS.',
    
    'p1.badge': 'Early Access',
    'p2.badge': 'Most Popular',
    'p3.badge': 'Flagship',

    'spec.val.battery': '3 Days',
    'spec.val.material': 'Food-grade Silicone',
    'spec.val.aicore': 'Local Processing',
    
    'spec.val.oled': 'OLED Eye-care',
    'spec.val.ocr': 'Wide Angle OCR',
    'spec.val.desk': 'Desk / Wear',
    
    'spec.val.eink': 'E-ink + OLED',
    'spec.val.stylus': 'Stylus + Voice',
    'spec.val.bio': 'Biometric',

    // Core Modules (Early - Bento Grid)
    'early.core.0.title': 'Rhythm Engine',
    'early.core.0.tag': 'Time Cognition',
    'early.core.0.desc': 'More than reminders; it\'s the start of cognitive rhythm.\nTeaching "what to do when," so habits grow naturally.',
    'early.core.1.title': 'Micro-Task System',
    'early.core.1.tag': 'Executive Cognition',
    'early.core.1.desc': 'Breaking life tasks into "doable steps" with positive feedback.\nTraining the "Do → Achieve → Repeat" execution loop.',
    'early.core.2.title': 'Photo Learning',
    'early.core.2.tag': 'Perceptual Cognition',
    'early.core.2.desc': 'Active exploration + multilingual explanation.\nBuilding the "See → Hear → Ask" cognitive link.',
    'early.core.3.title': 'Emotional AI',
    'early.core.3.tag': 'Emotional Cognition',
    'early.core.3.desc': 'Understanding tones like "I don\'t want to," offering gentle responses.\nHelping children build internal emotional order.',
    'early.core.4.title': 'Parent Sync',
    'early.core.4.tag': 'Meta-Cognition',
    'early.core.4.desc': 'Parents as collaborators, not managers.\nTask rates and interest keywords build family cognitive alignment.',

    // Core Modules (Growth - Bento Grid)
    'growth.core.0.title': 'Task Breaker',
    'growth.core.0.tag': 'Execution',
    'growth.core.0.desc': 'Breaking down homework steps to guide thinking and improve completion quality.',
    'growth.core.1.title': 'Review Lite',
    'growth.core.1.tag': 'Memory',
    'growth.core.1.desc': 'Auto-archiving mistakes, pushing lightweight reviews the next day to form a memory loop.',
    'growth.core.2.title': 'Voice Guide',
    'growth.core.2.tag': 'Interest',
    'growth.core.2.desc': 'Multiple Agents (English/Coding/Art) to spark interest and skill growth.',
    'growth.core.3.title': 'Time Guard',
    'growth.core.3.tag': 'Rhythm',
    'growth.core.3.desc': 'Personalized rhythm recommendations and reminders to build time sense and planning skills.',
    'growth.core.4.title': 'Parent View',
    'growth.core.4.tag': 'Synergy',
    'growth.core.4.desc': 'Data reports + advice cards for anxiety-free collaborative parenting.',
    
    // Trust System (Early)
    'early.trust.title': 'SAFETY FIRST',
    'early.trust.desc': 'We know safety is the first priority. Baseul protects from physical material to data privacy.',
    'early.trust.0.text': 'FOOD GRADE MATERIAL',
    'early.trust.0.sub': 'Skin-friendly silicone, waterproof & mute design',
    'early.trust.1.text': 'EYE PROTECTION',
    'early.trust.1.sub': 'Low blue light, no ads, designed for vision health',
    'early.trust.2.text': 'PARENT CONTROL',
    'early.trust.2.sub': 'Set usage times & content via App',
    'early.trust.3.text': 'LIFE MOMENTS MEMORY',
    'early.trust.3.sub': 'Local recording of interactions & growth milestones',

    // Trust System (Growth)
    'growth.trust.title': 'TRUST SYSTEM',
    'growth.trust.desc': 'Full-stack Trusted Architecture · Data Privacy Guard',
    'growth.trust.0.text': 'Vision-Enabled Logging',
    'growth.trust.0.sub': 'Full interaction recording, growth trajectory traceable',
    'growth.trust.1.text': 'Local-First AI',
    'growth.trust.1.sub': 'Voice/task data processed locally, default no cloud upload',
    'growth.trust.2.text': 'Long-Term Traceability',
    'growth.trust.2.sub': 'Long-term archiving of mistakes, interests, and tasks',
    'growth.trust.3.text': 'Parent Control Toolkit',
    'growth.trust.3.sub': 'Set time/screen/function permissions via App without intrusion',
};

const translations: Record<Region, Record<string, string>> = {
  US: commonUS,
  CN: {
    'nav.home': '首页',
    'nav.products': '产品体系',
    'nav.philosophy': '认知理念',
    'nav.blog': '成长日志',
    'nav.login': '登录',
    'nav.getStarted': '立即预订',
    'nav.joinList': '加入等待列表',
    'nav.joinShort': '加入',
    'nav.language': '语言',
    'nav.productsTitle': '产品系列',
    
    'hero.title.line1': '升级认知结构',
    'hero.title.line2': '匹配时代进化',
    'hero.eyebrow': 'Baseul Kids · AI学\u4E60机',
    'hero.subtitle': '用规范代替限制 Baseul Kids 用AI把节奏·任务·复盘打造为认知底座 习惯更稳 吸收更快 自驱与创造力持续升级 给孩子快乐成长与面对未来的底气',
    'hero.badge': '认知操作系统',
    'hero.explore': '探索三阶段',
    'hero.cta.waitlist': '加入等待列表',
    'hero.cta.join': '立即加入',
    'hero.cta.getStarted': '开始使用',
    'hero.cta.partner': '成为合作伙伴',

    'waitlist.title': '加入等待列表',
    'waitlist.desc': '请填写联系方式以获取最新动态。',
    'waitlist.input.cn': '手机号或微信号',
    'waitlist.input.en': '邮箱',
    'waitlist.submit': '加入',

    'partner.page.title': '成为 Baseul 合作伙伴',
    'partner.page.desc': '加入我们，共同构建下一代的认知操作系统。',
    'partner.tab.team': '加入团队',
    'partner.tab.distributor': '经销合作',
    'partner.form.role': '选择职位',
    'partner.role.dev': '开发人员',
    'partner.role.design': '设计人员',
    'partner.role.brand': '品牌/市场人员',
    'partner.role.other': '其他',
    'partner.form.exp': '个人说明',
    'partner.form.contact': '手机或邮箱',
    'partner.form.region': '所在地区',
    'partner.form.submit': '提交申请',

    'video.title.line1': '给孩子会升级的',
    'video.title.line2': '认知结构',
    'video.description': '从习惯与兴趣启程 加速理解与吸收 最终走向自驱与创造 与时代同频成长',
    'video.button': '了解认知理念',

    'products.badge': '三阶段 × 三形态',
    'products.title': '认知成长三部曲',
    'products.subtitle': '针对不同年龄段的认知主轴，打造的进阶式成长系统。',
    
    'p1.title': 'Baseul Kids · 幼幼版',
    'p1.age': '3-6 岁 | 认知建立阶段',
    'p1.desc': '嵌入式AI情绪陪伴体。理解孩子的节奏，将生活习惯结构化。它不是互动玩具，而是“行为组织器”。',
    'p1.tag': '节奏建立 × 习惯养成',
    'p1.name': '幼幼版 (3-6)',

    'p2.title': 'Baseul Kids · 成长版',
    'p2.age': '6-9 岁 | 认知组织阶段',
    'p2.desc': '桌面AI伴学体。学会拆解任���、排列节奏。AI从提醒者进化为引导者，帮助孩子构建“目标-反馈”闭环。',
    'p2.tag': '任务调度 × 专注力',
    'p2.name': '成长版 (6-9)',

    'p3.title': 'Baseul Kids · 探索版',
    'p3.age': '9+ 岁 | 认知主导阶段',
    'p3.desc': '折叠式AI认知终端。孩子的第一台“成长中枢”。无娱乐干扰，专注于目标规划、路径推荐与自我优化。',
    'p3.tag': '系统规划 × 自我驱动',
    'p3.name': '探索版 (9+)',

    'p4.title': 'Baseul Memory',
    'p4.age': '全年龄段',
    'p4.desc': '私有轻 NAS。记录孩子的所有成长数据和知识积累。',
    'p4.tag': '成长记录 × 知识库',
    'p4.name': 'Baseul Memory',

    'home.memory.title': 'Baseul Memory',
    'home.memory.subtitle': '认知核心服务器',
    'home.memory.desc': '这是一个轻 NAS，记录孩子所有的问题回答，形成孩子自己的成长历程和知识库。这是记录孩子从小到大成长过程的工具。',
    'home.memory.benefit': '搭配我们的三个产品使用。让AI伴随孩子成长。随着积累，孩子的认知能力、学习能力、创造能力将远超同龄人。',
    'home.memory.cta': '查看 Baseul Memory',

    'info.s1.title.line1': '习惯即',
    'info.s1.title.line2': '成长 Room',
    'info.s1.desc': '在我们的系统中，每一个看似简单的动作（刷牙、晚安）都被建模为一个完整的“成长Room”。这不是一次性互动，而是包含起点、过程与达成的结构化闭环。',
    'info.s1.button': '查看系统逻辑',
    'info.s1.vision': '结构化',
    
    'info.s2.title.line1': '纯净守护',
    'info.s2.title.line2': '& 数据主权',
    'info.s2.desc': '孩子的成长数据属于他们自己。本地AI引擎确保隐私安全，无广告、无社交轰炸，只为成长留白。',
    'info.s2.list1': '本地 AI 语义处理',
    'info.s2.list2': '去娱乐化纯净系统',
    'info.s2.list3': 'MapSul 跨龄档案兼容',
    'info.s2.quote': '它不只是设备，而是孩子命运结构的一部分。',

    'info.manifesto.badge': '核心理念',
    'info.manifesto.title.1': '这不是工具',
    'info.manifesto.title.2': '是孩子认知成长的基建',
    'info.manifesto.desc': '孩子终将面对一个智能主导的世界。从现在起，他要的不是填知识，而是拥有能调度成长的系统能力。Baseul Kids 是为未来而设计的成长节奏引擎。它不只是回答问题，更能组织习惯、引导情绪、沉淀自驱。',
    'info.manifesto.button': '阅读宣言',
    
    'info.feat.1.title': '认知映射',
    'info.feat.1.desc': '孩子成长的不只是知识，而是结构化思维。随着年龄与任务变化，AI自动调整认知挑战节奏。',
    'info.feat.2.title': '节奏引擎',
    'info.feat.2.desc': '用可预测的节奏替代混乱与催促。让日常变成孩子能完成的任务循环，提升掌控感。',
    'info.feat.3.title': '数据主权',
    'info.feat.3.desc': '���一句话、每一次互动都只属于你的家庭。本地处理，不上传语音，不连接外部平台。',
    'info.feat.4.title': '情绪AI',
    'info.feat.4.desc': '孩子说“我不想学”不是偷懒，是压力信号。AI理解语气与状态，提供适时回应与转化路径。',
    'info.feat.5.title': '家庭同步',
    'info.feat.5.desc': '成长不是一个人完成，是家庭协同的节奏。家长可见任务·状态·节奏，孩子更安心完成。',
    'info.feat.6.title': '专注流',
    'info.feat.6.desc': '让孩子沉浸而不沉迷。自动识别任务阶段，进入沉浸节奏，排除干扰。',

    'testimonials.title': '家长的认知共鸣',
    'testimonials.subtitle': '从“管教孩子”到“协同成长”的转变。',
    
    'testi.1.content': "“幼幼版”彻底改变了我们的早晨流程。我4岁的儿子现在真的很享受刷牙，因为他想完成那个‘闭环’。",
    'testi.1.name': "Sarah Jenkins",
    'testi.1.role': "两个孩子的母亲 (4岁 & 7岁)",
    
    'testi.2.content': "终于有了减少焦虑而不是制造焦虑的科技。‘结构大于刺激’正是这一代孩子所需要的。",
    'testi.2.name': "Dr. Aris Thorne",
    'testi.2.role': "儿童心理学家",
    
    'testi.3.content': "我测试过几十种‘智能’玩具。Baseul不是玩具。它是孩子生活中美丽、冷静的操作系统。硬件质量无与伦比。",
    'testi.3.name': "Michelle Wu",
    'testi.3.role': "教育科技主管",
    
    'testi.4.content': "我女儿非常喜欢‘探索版’套件。它帮助她在不整天盯着屏幕的情况下理解编程概念。",
    'testi.4.name': "James Chen",
    'testi.4.role': "9岁孩子的父亲",
    
    'testi.5.content': "这是我们用过的最直观的学习系统。它随着孩子的成长完美适应。强烈推荐！",
    'testi.5.name': "Emily Ross",
    'testi.5.role': "在家教育的母亲",
    
    'testi.6.content': "设计一流。它在我们客厅里看起来很棒，不像大多数塑料儿童科技产品。功能性更是没得说。",
    'testi.6.name': "David Kim",
    'testi.6.role': "建筑师",

    'blog.badge': '系统迭代',
    'blog.title': '成长深度观察',
    'blog.viewAll': '��看全部',
    'blog.post1.title': '为什么我们需要“认知操作系统”？',
    'blog.post1.desc': 'AI时代，比知识更重要的是与智能协作的能力。',
    'blog.post1.read': '阅读深度文',
    'blog.post2.title': '如何用“Room”理论建立秩序感',
    'blog.post3.title': '告别算法沉迷：重获注意力',
    'blog.tag.coding': '认知',
    'blog.tag.robotics': '系统',
    'blog.tag.health': '隐私',

    'footer.title.line1': '认知力是时代稀缺品',
    'footer.title.line2': '我们帮你提前准备好',
    'footer.subscribe.placeholder': '加入等待列表',
    'footer.subscribe.button': '加入',
    'footer.copyright': '© 2025 Baseul Kids. 认知操作系统.',

    // Trilogy Cards
    'trilogy.card1.title': '快乐来自认知建立',
    'trilogy.card1.name': 'Baseul Kids 幼幼版',
    'trilogy.card1.benefit': '把刷牙收拾睡前故事结构化为小任务 孩子笑着完成 家长少催少吼',
    'trilogy.card1.desc': '嵌入式AI情绪陪伴体，理���孩子的节奏，将生活习惯结构化。它不仅仅是玩具，而是行为组织器。',
    'trilogy.card1.sub': '节奏建立 × 习惯养成',
    'trilogy.card1.cta': '了解幼幼版',
    'trilogy.card1.badge': '幼幼版 3–6',

    'trilogy.card2.title': '进步来自认知组织',
    'trilogy.card2.name': 'Baseul Kids 成长版',
    'trilogy.card2.benefit': '把作业拆成步骤把知识连成意义 吸收更快理解更深 每天看得见进步',
    'trilogy.card2.desc': 'AI伴学体，学会拆解任务，排列节奏。AI从提醒者进化为引导者，帮助孩子构建“目标-反馈”闭环。',
    'trilogy.card2.sub': '任务调度 × 专注力',
    'trilogy.card2.cta': '了解成长版',
    'trilogy.card2.badge': '成长版 6–9',

    'trilogy.card3.title': '成就来自认知主导',
    'trilogy.card3.name': 'Baseul Kids 探索版',
    'trilogy.card3.benefit': '以目标·路径·复盘的闭环自己规划自己推进自己总结 越学越会学',
    'trilogy.card3.desc': 'AI认知终端，孩子的第一台成长中枢。无娱乐干扰，专注于目标规划，路径推荐与自我优化。',
    'trilogy.card3.sub': '系统规划 × 自我驱动',
    'trilogy.card3.cta': '了解探索版',
    'trilogy.card3.badge': '探索版 9+',

    'trilogy.card4.title': '家庭认知中枢',
    'trilogy.card4.name': 'Baseul Memory',
    'trilogy.card4.benefit': '记录成长 存储知识 连接未来',
    'trilogy.card4.desc': '这是一个私有轻NAS，记录孩子所有的问题回答，形成孩子自己的成长历程和知识库。',
    'trilogy.card4.sub': '成长记录 × 知识库',
    'trilogy.card4.cta': '了解 Baseul Memory',
    
    // Early Bento
    'p1.bento.1.title': '节奏\n引擎',
    'p1.bento.1.desc': '根据作息自动提示时间点 孩子在节奏中行动更安心',
    'p1.bento.2.title': '小任务系统',
    'p1.bento.2.sub': '动作结构化 · 正反馈',
    'p1.bento.3.title': '语音互动 / 情绪AI',
    'p1.bento.3.sub': '识别语气 · 温柔回应',
    'p1.bento.4.title': '拍照识物',
    'p1.bento.4.sub': '激发主动学习',
    'p1.bento.5.title': '家长协同',
    'p1.bento.5.sub': '非打扰式陪伴',
    'detail.cta.early.desc': '孩子不是缺配合，是缺结构化引导。现在就是最好的起点。',

    // Early Scenarios (Detailed)
    'p1.s1.eng': '感知认知 (Perceptual Cognition)',
    'p1.s1.title': '拍照识物 × 多语言讲解',
    'p1.s1.desc': '设备内���摄像识别系统 + 语音讲解模块，自动识别物品并匹配语言包播报，可在 App 内自由切换中/英/日等语言。',
    'p1.s1.imgTitle': '一拍就懂，认识世界',
    'p1.s1.imgSub': '孩子对准物品拍照，AI立即识别名称并讲解，还可切换多语言，激发提问欲望和语言表达力',

    'p1.s2.eng': '情境认知 (Contextual Cognition)',
    'p1.s2.title': 'NFC 玩偶 × 互动学习',
    'p1.s2.desc': '每个玩偶内含唯一身份标签，设备联网获取专属内容，进入匹配的互动场景模式（如角色问答、沉浸式小剧场等）。',
    'p1.s2.imgTitle': '换个玩偶，换个小世界',
    'p1.s2.imgSub': '通过 NFC 感应，设备识别不同玩偶身份并进入专属交互模式（故事/游戏/提问），让孩子在扮演与互动中自然构建认知',

    'p1.s3.eng': '执行认知 (Executive Cognition)',
    'p1.s3.title': '个性化任务 × 节奏引导',
    'p1.s3.desc': '系统会根据孩子的兴趣偏好、执行表现与成长阶段，动态生成适配的节奏任务，陪伴并引导孩子逐步养成生活自信与节律。',
    'p1.s3.imgTitle': '从“做不到”到“我完成了！”',
    'p1.s3.imgSub': '生活任务（如刷牙/收拾）被拆解成小步骤，完成即奖励光圈或语音鼓励，孩子在正反馈中逐步建立生活节奏与信心',

    'p1.s4.eng': '情绪认知 (Emotional Cognition)',
    'p1.s4.title': '智能记录 × 家长安心',
    'p1.s4.desc': '设备可自动记录孩子在幼儿园/托育环境中的声音与画面，遇到异常哭声可及时推送提醒，帮助家长了解孩子是否被忽视或受到不当对待。',
    'p1.s4.imgTitle': '不在身边，也知道发生了什么',
    'p1.s4.imgSub': '设备可定时拍照、识别哭声自动录音，帮助家长回顾关键时刻，了解孩子独处时的情绪与状态',

    'p1.s5.eng': '元认知 (Meta-Cognition)',
    'p1.s5.title': 'App 协同 × 智能育儿建议',
    'p1.s5.desc': '系统自动分析交互数据与语音关键词，生成每周报告与建议卡片，支持一键调节任务强度与节奏分布。',
    'p1.s5.imgTitle': '不是监控，而是协同',
    'p1.s5.imgSub': 'App 可查看孩子的任务完成情况、兴趣关键词、语音互动记录，并生成个性化育儿建议，减少焦虑，提升陪伴质量',

    // Growth Bento
    'p2.bento.1.title': 'TASK BREAKER',
    'p2.bento.1.desc': '把复杂任务结构化成可执行步骤 提高专注和完成率',
    'p2.bento.2.title': '错题轻复习',
    'p2.bento.3.title': '作业伴读',
    'p2.bento.4.title': '自驱力评分',

    // Explore Bento
    'p3.bento.1.title': 'SYSTEM OS',
    'p3.bento.1.desc': '专为目标规划与知识管理打造的操作系统',

    // Product Detail UI
    'detail.coreModules': '核心模块',
    'detail.safetyFirst': '安全第一',
    'detail.trustNorms': '信任与规范',
    'detail.startNow': '立即开始',
    'detail.limitedSpots': '名额有限',
    'detail.joinWaitlist': '加入等待列表',
    'detail.viewSpecs': '查看技术规格',
    'detail.bindDevice': '绑定已有设备',
    'detail.saveHistory': '保存成长史',
    'detail.saveHistoryDesc': '从今天开始，保存属于孩子的认知成长史。这是送给未来最好的礼物。',
    'detail.safety.desc': '我们深知安全是第一优先级。Baseul 从物理材质到数据隐私，全方位守护。',
    'detail.safety.material': '食品级材质 & 静音结构',
    'detail.safety.materialSub': '采用亲肤硅胶外壳，抗摔、防水、安全可咬。物理结构无喇叭孔，夜间自动静音不打扰。',
    'detail.safety.eye': '护眼低刺激屏幕',
    'detail.safety.eyeSub': '无广告干扰、低蓝光低亮度调节，专为儿童视觉健康设计。',
    'detail.safety.control': '家长一键控时段',
    'detail.safety.controlSub': '配套 App 可设置使用时段、内容权限，让设备配合家庭作息，避免过度依赖。',
    'detail.safety.memory': '全程成长记录',
    'detail.safety.memorySub': '每次互动、每项任务、每段语音都会本地记录，生成成长档案，家长随时可查看孩子的状态与节奏，安心不缺席。',
    'detail.safety.noCamera': '无摄像头',
    'detail.safety.noCameraSub': '保护隐私',
    'detail.safety.local': '本地分析',
    'detail.safety.localSub': '无数据上传',
    'detail.safety.export': '可导出数据',
    'detail.safety.exportSub': '数据归你所有',
    'detail.safety.parent': '家长控制',
    'detail.safety.parentSub': '无广告',

    // Product Feature Lists
    'p1.list.1': '习惯闭环：刷牙、睡眠、整理',
    'p1.list.2': '无屏语音交互',
    'p1.list.3': '食品级硅胶 & 兼容玩偶',
    'p1.list.4': '情绪响应系统',
    'p1.list.5': '亲子数据同步',
    'p2.list.1': '任务拆解引擎',
    'p2.list.2': '坐姿监测摄像头',
    'p2.list.3': '专注计时 & 休息',
    'p2.list.4': '桌面 & 穿戴模式',
    'p2.list.5': '作业辅导 AI',
    'p3.list.1': '项目管理',
    'p3.list.2': '系统思维',
    'p3.list.3': '目标追踪',
    'p3.list.4': '自我纠正',
    'p3.list.5': '云端同步',

    // Scenarios (Hero Cards)
    'p1.sc.1.title': '晨间唤醒',
    'p1.sc.1.desc': '温柔灯光唤醒孩子，用歌声引导刷牙流程。',
    'p1.sc.2.title': '互动学习',
    'p1.sc.2.desc': '无屏幕互动讲故事，培养想象力。',
    'p1.sc.3.title': '梦境模式',
    'p1.sc.3.desc': '轻柔摇篮曲和夜灯，建立健康睡眠模式。',
    'p1.sc.4.title': '拍照识物',
    'p1.sc.4.desc': '孩子举起设备识物 AI讲解名称与扩展信息 激发主动学习',
    'p1.sc.5.title': '家长协同',
    'p1.sc.5.desc': 'App 可设置节奏 查看完成率与兴趣热词 实现非打扰式陪伴',
    'p2.s1.eng': '任务认知 (Task Cognition)',
    'p2.s1.title': '不是搜题秒答，而是陪你一起把题做完',
    'p2.s1.desc': '系统逐步拆解题目，引导解题思路，同时识别不良坐姿及时提醒，帮助养成专注又健康的学习习惯。',
    'p2.s1.imgTitle': 'AI陪做作业 × 解题引导＋坐姿提醒',
    'p2.s1.imgSub': '系统会将复杂作业任务拆解为多步小任务，逐步引导孩子完成解题思路，而非直接给出答案。摄像头同步识别孩子坐姿，当出现趴写或歪头等问题会及时提示。',

    'p2.s2.eng': '兴趣认知 (Interest Cognition)',
    'p2.s2.title': '一个AI手机，多个兴趣陪练老师',
    'p2.s2.desc': '英语对话 / 绘画 / 编程等 Agent 一键切换，帮助激发表达力与创造力，省下一堆报班焦虑。',
    'p2.s2.imgTitle': '多兴趣AI × 英语陪练 / 技能激发',
    'p2.s2.imgSub': '内置多个兴趣AI Agent，支持英语口语练习、绘画创作、编程小游戏等互动场景，每个角色都具备任务指引与语音反馈功能。',

    'p2.s3.eng': '社交认知 (Social Cognition)',
    'p2.s3.title': '学习不孤单，轻碰也能交到好朋友',
    'p2.s3.desc': '一碰加好友，参与学习或兴趣小组，孩子在表达与互动中提升社交边界感。',
    'p2.s3.imgTitle': '社交互碰 × 学习 / 兴趣群组',
    'p2.s3.imgSub': '设备支持 NFC 一碰加好友，同时可查看对方的兴趣关键词与任务记录。进入学习/兴趣小组后，孩子可参与群组任务协作，构建“结构化社交”环境。',

    'p2.s4.eng': '时间认知 (Time Cognition)',
    'p2.s4.title': '不是提醒做事，而是教会安排时间',
    'p2.s4.desc': '系统根据孩子的强项与短板制定节奏计划，错题自动复习，强项精准进阶，完成任务点亮闭环奖励。',
    'p2.s4.imgTitle': '智能节奏 × 计划安排 / 复盘激励',
    'p2.s4.imgSub': '系统会结合孩子的短板错题与兴趣方向生成个性化学习节奏表，每日节奏包含任务推荐与时间段安排。完成后会点亮任务闭环奖励。',

    'p2.s5.eng': '元认知协同 (Meta-Cognition Synergy)',
    'p2.s5.title': '不是监控孩子，而是看见成长',
    'p2.s5.desc': 'App 自动生成兴趣点、表达频率与任务执行率报告，结合个性化建议卡，协同家长科学引导。',
    'p2.s5.imgTitle': '家长App × 智能建议与成长分析',
    'p2.s5.imgSub': '家长App可查看孩子每天的任务完成率、表达频率、兴趣点变化与错题记录。系统基于语音交互与行为轨迹生成成长建议卡。',
    'p3.sc.1.title': '自我规划',
    'p3.sc.1.desc': '设定周目标并自主拆解。',
    'p3.sc.2.title': '深度工作',
    'p3.sc.2.desc': '长时间编码或写作，无干扰。',
    'p3.sc.3.title': '系统复盘',
    'p3.sc.3.desc': '每周分析生产力和专注模式。',
    'p3.sc.4.title': '资源收集',
    'p3.sc.4.desc': '为项目收集并整理必要信息。',
    'p3.sc.5.title': '同伴协作',
    'p3.sc.5.desc': '与伙伴共同推进目标。',

    // Product Detail Page Content
    'p1.hero.tagline': '让孩子在节奏中快乐成长',
    'p1.hero.intro': '3–6 岁是认知习惯与情绪调节能力建立的关键窗口，Baseul 幼幼版帮助孩子将日常任务结构化，让他们在生活中建立秩序感与成就感。',
    'p2.hero.tagline': '让任务有路径 让学习看得见进步',
    'p2.hero.intro': 'Baseul 成长版帮助孩子将抽象的任务拆解为清晰的步骤。从作业到兴趣，帮助孩子构建“目标-反馈”闭环。',
    'p3.hero.tagline': '从被安排走向自驱',
    'p3.hero.intro': 'Baseul 探索版是大龄孩子的指挥中心。它将重点从“听话做事”转移到“自主规划”。',
    'memory.hero.tagline': '孩子的成长不该只是今天的事',
    'memory.hero.intro': 'Baseul Memory 是一台认知记忆服务器。它记录每一次互动 每一个问题 每一个兴趣点，形成孩子自己的“成长轨道”。',
    'memory.sc.1.title': '语音历史 × 自我认知发展',
    'memory.sc.1.desc': '孩子问过的问题、讲过的话、说出的情绪都被记录进自己的成长时间线',
    'memory.sc.2.title': '生成式成长档案',
    'memory.sc.2.desc': '系统生成孩子的学习轨迹、兴趣图谱、表达词汇成长树',
    'memory.sc.3.title': '家长共读 × 专属陪伴',
    'memory.sc.3.desc': '家长可定期收到孩子成长摘要报告，用内容连接真正的教育共鸣',
    'memory.sc.4.title': 'AI模型持续优化',
    'memory.sc.4.desc': '设备行为将根据成长反馈不断进化，实现真正“个性化陪伴”',
    'memory.sc.5.title': '成长建议 × 智能个性化推送',
    'memory.sc.5.desc': '根据孩子过往提问、兴趣变化与表达能力生成个性化建议，支持内容推荐、任务引导与节奏优化',
    'memory.sc.6.title': '模块化精工设计',
    'memory.sc.6.desc': '高性能本地算力核心，支持模块化扩展，隐私与性能兼得。',

    // Specs
    'spec.battery': '电池', 'spec.material': '材质', 'spec.aicore': 'AI核心',
    'spec.display': '屏幕', 'spec.camera': '摄像头', 'spec.mode': '模式',
    'spec.screen': '屏幕', 'spec.input': '输入', 'spec.security': '安全',

    // Product Details - UI & Values
    'detail.back': '返回系统界面',
    'detail.addToOrder': '加入订单',
    'detail.bundle.title': '搭配 Baseul Memory',
    'detail.bundle.desc': '安全存储孩子的成长数据。本地私有云 NAS，永久保存。',
    
    'p1.badge': '抢先体验',
    'p2.badge': '最受欢迎',
    'p3.badge': '旗舰版',

    'spec.val.battery': '3 天长续航',
    'spec.val.material': '食品级硅胶',
    'spec.val.aicore': '本地计算',
    
    'spec.val.oled': 'OLED 护眼屏',
    'spec.val.ocr': '广角 OCR 识别',
    'spec.val.desk': '桌面 / 穿戴',
    
    'spec.val.eink': '墨水屏 + OLED',
    'spec.val.stylus': '手写笔 + 语音',
    'spec.val.bio': '生物识别',

    // Core Modules (Early - Bento Grid)
    'early.core.0.title': '节奏引擎',
    'early.core.0.tag': '时间认知',
    'early.core.0.desc': '不只是提醒时间点，更是认知节奏的起点。\n让孩子知道“什么时候该做什么”，习惯从节奏中长出。',
    'early.core.1.title': '小任务系统',
    'early.core.1.tag': '执行认知',
    'early.core.1.desc': '将生活任务分解为“小步可做”，完成即正反馈。\n训练孩子“做 → 得到 → 再做”的正向执行力。',
    'early.core.2.title': '拍照识物',
    'early.core.2.tag': '感知认知',
    'early.core.2.desc': '主动探索 + 多语讲解，构建“看 → 听 → 问”的认知链路。\n让好奇心驱动认知，形成世界感。',
    'early.core.3.title': '情绪 AI',
    'early.core.3.tag': '情绪认知',
    'early.core.3.desc': '理解“不想动 / 我不要”等情绪语气，给予温和回应。\n帮助孩子建立“说出感觉 → 被理解”的内在秩序。',
    'early.core.4.title': '家长协同',
    'early.core.4.tag': '元认知协同',
    'early.core.4.desc': '家长不是管理者，而是协作者。\n任务完成率、兴趣热词与建议卡片，构建家庭认知同频。',

    // Core Modules (Growth - Bento Grid)
    'growth.core.0.title': '拆题引导引擎',
    'growth.core.0.tag': '拆题引导',
    'growth.core.0.desc': '拆解作业步骤，引导思路，提升完成质量',
    'growth.core.1.title': '错题轻复习',
    'growth.core.1.tag': '错题复习',
    'growth.core.1.desc': '自动归档错题，次日推送轻量复习，形成闭环记忆',
    'growth.core.2.title': '多兴趣AI陪练',
    'growth.core.2.tag': '兴趣激发',
    'growth.core.2.desc': '多个Agent（英语/编程/绘画）激发兴趣表达和技能成长',
    'growth.core.3.title': '节奏守护',
    'growth.core.3.tag': '时间管理',
    'growth.core.3.desc': '个性化时间节奏推荐与提醒，建立孩子的时间感与计划力',
    'growth.core.4.title': '家长视角协同',
    'growth.core.4.tag': '协同养育',
    'growth.core.4.desc': '数据报告+建议卡，协同养育不焦虑',

    // Trust System (Early)
    'early.trust.title': '安全第一',
    'early.trust.desc': '我们深知安全是第一优先级。Baseul 从物理材质到数据隐私，全方位守护。',
    'early.trust.0.text': '食品级材质 & 静音结构',
    'early.trust.0.sub': '采用亲肤硅胶外壳，抗摔、防水、安全可咬。物理结构无喇叭孔，夜间自动静音不打扰。',
    'early.trust.1.text': '护眼低刺激屏幕',
    'early.trust.1.sub': '无广告干扰、低蓝光低亮度调节，专为儿童视觉健康设计。',
    'early.trust.2.text': '家长一键控时段',
    'early.trust.2.sub': '配套 App 可设置使用时段、内容权限，让设备配合家庭作息，避免过度依赖。',
    'early.trust.3.text': '全程成长记录',
    'early.trust.3.sub': '每次互动、每项任务、每段语音都会本地记录，生成成长档案，家长随时可查看孩子的状态与节奏，安心不缺席。',

    // Trust System (Growth)
    'growth.trust.title': 'TRUST SYSTEM｜全栈可信架构 · 数据私密守护',
    'growth.trust.desc': '从硬件到底层架构，守护成长数据的绝对主权',
    'growth.trust.0.text': '行为记录摄像头',
    'growth.trust.0.sub': '有摄像头，全程记录交互过程，保障成长轨迹可查',
    'growth.trust.1.text': '本地分析优先',
    'growth.trust.1.sub': '所有语音与任务数据本地处理，默认不上云',
    'growth.trust.2.text': '成长数据归档',
    'growth.trust.2.sub': '错题 / 兴趣 / 任务完成等数据长期归档展示',
    'growth.trust.3.text': '家长调控系统',
    'growth.trust.3.sub': 'App端可设时段、屏幕、功能等权限，不打扰但可协同',
  },
  CA: commonUS,
  FR: {
    ...commonUS,
    'nav.home': 'Accueil',
    'nav.products': 'Produits',
    'nav.philosophy': 'Philosophie',
    'nav.blog': 'Blog',
    'nav.login': 'Connexion',
    'nav.getStarted': 'Commencer',
    'nav.language': 'Langue',
    
    'hero.title.line1': 'OS COGNITIF',
    'hero.title.line2': 'POUR NATIFS DE L\'IA',
    'hero.subtitle': 'Baseul Kids n\'est pas un jouet. C\'est un système d\'entraînement cognitif conçu pour construire le rythme, l\'autonomie et les compétences de collaboration pour l\'ère de l\'IA.',
    'hero.explore': 'Explorer le Système',
    
    'video.title.line1': 'Construire',
    'video.title.line2': 'Structures Cognitives',
    'video.button': 'Notre Philosophie',
    
    'products.title': 'La Trilogie Cognitive',
    'products.subtitle': 'Un système de croissance complet évoluant avec le développement cognitif de votre enfant.',
    
    'footer.title.line1': 'CONCEVOIR',
    'footer.title.line2': 'L\'ÉTAT D\'ESPRIT',
    'detail.coreModules': 'MODULES CENTRAUX',
    'detail.safetyFirst': 'SÉCURITÉ AVANT TOUT',
    'detail.trustNorms': 'CONFIANCE & NORMES',
    'detail.startNow': 'COMMENCER',
    'detail.limitedSpots': 'PLACES LIMITÉES',
    'detail.joinWaitlist': 'Rejoindre la liste',
    'detail.viewSpecs': 'Voir les spécifications',
    'detail.bindDevice': 'Lier un appareil',
    'detail.saveHistory': 'SAUVER L\'HISTOIRE',
    'detail.saveHistoryDesc': 'Commencez dès aujourd\'hui à sauvegarder l\'histoire cognitive de votre enfant.',
    'detail.safety.desc': 'La sécurité est notre priorité. Baseul protège de la matière physique à la confidentialité des données.',
    'detail.safety.noCamera': 'PAS DE CAMÉRA',
    'detail.safety.noCameraSub': 'Confidentialité d\'abord',
    'detail.safety.local': 'ANALYSE LOCALE',
    'detail.safety.localSub': 'Pas de téléchargement',
    'detail.safety.export': 'EXPORTER DONNÉES',
    'detail.safety.exportSub': 'Vos données',
    'detail.safety.parent': 'CONTRÔLE PARENTAL',
    'detail.safety.parentSub': 'Pas de publicité',
  },
  DE: {
    ...commonUS,
    'nav.home': 'Startseite',
    'nav.products': 'Produkte',
    'nav.philosophy': 'Philosophie',
    'nav.blog': 'Blog',
    'nav.login': 'Anmelden',
    'nav.getStarted': 'Starten',
    'nav.language': 'Sprache',
    
    'hero.title.line1': 'KOGNITIVES OS',
    'hero.title.line2': 'FÜR KI-NATIVES',
    'hero.subtitle': 'Baseul Kids ist kein Spielzeug. Es ist ein kognitives Trainingssystem, das Rhythmus, Autonomie und Kollaborationsfähigkeiten für das KI-Zeitalter aufbaut.',
    'hero.explore': 'System Erkunden',
    
    'video.title.line1': 'Aufbau',
    'video.title.line2': 'Kognitiver Strukturen',
    'video.button': 'Unsere Philosophie',
    
    'products.title': 'Die Kognitive Trilogie',
    'products.subtitle': 'Ein komplettes Wachstumssystem, das sich mit der kognitiven Entwicklung Ihres Kindes entwickelt.',
    
    'footer.title.line1': 'ENTWERFEN SIE',
    'footer.title.line2': 'DAS MINDSET',
    'detail.coreModules': 'KERNMODULE',
    'detail.safetyFirst': 'SICHERHEIT ZUERST',
    'detail.trustNorms': 'VERTRAUEN & NORMEN',
    'detail.startNow': 'JETZT STARTEN',
    'detail.limitedSpots': 'BEGRENZTE PLÄTZE',
    'detail.joinWaitlist': 'Warteliste beitreten',
    'detail.viewSpecs': 'Technische Daten',
    'detail.bindDevice': 'Gerät verbinden',
    'detail.saveHistory': 'GESCHICHTE SPEICHERN',
    'detail.saveHistoryDesc': 'Beginnen Sie heute damit, die kognitive Geschichte Ihres Kindes zu speichern.',
    'detail.safety.desc': 'Sicherheit ist unsere Priorität. Baseul schützt vom physischen Material bis zum Datenschutz.',
    'detail.safety.noCamera': 'KEINE KAMERA',
    'detail.safety.noCameraSub': 'Privatsphäre zuerst',
    'detail.safety.local': 'LOKALE ANALYSE',
    'detail.safety.localSub': 'Kein Upload',
    'detail.safety.export': 'DATEN EXPORTIEREN',
    'detail.safety.exportSub': 'Ihre Daten',
    'detail.safety.parent': 'ELTERN KONTROLLE',
    'detail.safety.parentSub': 'Keine Werbung',
  },
  ES: commonUS
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { currentRegion, setRegion } = useNavigation();
  const region = currentRegion;
  
  // Map region to language code
  const langMap: Record<Region, string> = {
    US: 'en', CN: 'zh', CA: 'en', FR: 'fr', DE: 'de', ES: 'es'
  };
  const language = langMap[region] || 'en';
  
  React.useEffect(() => {
    // Update html lang attribute
    const htmlLangMap: Record<Region, string> = {
      US: 'en', CN: 'zh-CN', CA: 'en', FR: 'fr', DE: 'de', ES: 'es'
    };
    document.documentElement.lang = htmlLangMap[region];
    
    // Font adjustments for Chinese
    if (region === 'CN') {
      // Using PingFang SC, Microsoft YaHei, and Noto Sans SC for a modern, clean look
      document.body.style.fontFamily = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    } else {
      document.body.style.fontFamily = ''; // Reset to CSS default
    }
  }, [region]);

  const t = (key: string) => {
    return translations[region][key] || translations['US'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ region, language, setRegion, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}