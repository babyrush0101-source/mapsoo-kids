// Initial blog data for Baseul Kids
export interface ContentBlock {
  type: 'text' | 'image' | 'video';
  value: string;
  caption?: string;
}

export interface BlogComment {
  id: string;
  blogId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; // Legacy field for simple text content
  excerpt: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  contentType: 'text' | 'image-text' | 'video-text';
  blocks: ContentBlock[];
  featured?: boolean; // For Bento grid sizing
  category?: string; // Blog category
  tags?: string[]; // Blog tags for filtering
  likes?: number; // Like count
  commentCount?: number; // Comment count
}

export const initialBlogs: BlogPost[] = [
  {
    id: 'blog_1',
    title: 'The Science Behind Early Childhood Memory Development',
    excerpt: 'Understanding how children develop memory skills and how technology can support this natural process.',
    content: 'Memory development in early childhood is a fascinating journey...',
    published: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    contentType: 'image-text',
    featured: true,
    category: 'Child Development',
    tags: ['memory', 'neuroscience', 'learning'],
    likes: 42,
    commentCount: 8,
    blocks: [
      {
        type: 'text',
        value: 'Memory development in early childhood is a fascinating journey that shapes how children learn, interact, and understand the world around them. Recent research in neuroscience has revealed incredible insights into how young minds develop these critical cognitive abilities.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1631032024590-140cc8dd4b32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGxlYXJuaW5nJTIwcGxheXxlbnwxfHx8fDE3NjQ0MjgyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Children learning through play and interaction'
      },
      {
        type: 'text',
        value: 'Between ages 0-6, children experience rapid brain development. The hippocampus, crucial for memory formation, undergoes significant growth during this period. This is why early childhood experiences have such a lasting impact on cognitive development.'
      },
      {
        type: 'text',
        value: 'At Baseul Kids, we leverage these scientific insights to create tools that support natural memory development. Our approach combines play-based learning with technology that adapts to each child\'s developmental stage, making learning both effective and enjoyable.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1633219664515-2441564d0cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2RkbGVyJTIwZWR1Y2F0aW9ufGVufDF8fHx8MTc2NDQyODI1NXww&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Interactive learning environments promote memory development'
      },
      {
        type: 'text',
        value: 'Key principles we follow:\n\n• Repetition with variation keeps learning engaging\n• Multi-sensory experiences create stronger memory traces\n• Emotional connections enhance memory retention\n• Age-appropriate challenges promote cognitive growth\n\nBy understanding these principles, parents and educators can create supportive environments that nurture children\'s natural learning abilities.'
      }
    ]
  },
  {
    id: 'blog_2',
    title: 'Introducing Baseul Memory: A New Way to Track Your Child\'s Growth',
    excerpt: 'Discover how our innovative memory feature helps parents capture and celebrate every milestone.',
    content: 'We are excited to introduce Baseul Memory...',
    published: true,
    createdAt: '2025-01-20T14:30:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
    contentType: 'video-text',
    featured: true,
    category: 'Product Updates',
    tags: ['baseul-memory', 'milestones', 'parenting'],
    likes: 56,
    commentCount: 12,
    blocks: [
      {
        type: 'text',
        value: 'We are excited to introduce Baseul Memory, a revolutionary feature designed to help parents document and celebrate their child\'s developmental journey. In today\'s fast-paced world, precious moments can slip by unnoticed. Baseul Memory ensures you never miss a milestone.'
      },
      {
        type: 'video',
        value: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        caption: 'Watch how Baseul Memory transforms milestone tracking'
      },
      {
        type: 'text',
        value: 'What makes Baseul Memory special?\n\n**Smart Milestone Tracking**: Our AI-powered system suggests age-appropriate milestones while allowing you to customize tracking to your child\'s unique journey.\n\n**Rich Media Capture**: Add photos, videos, voice notes, and written observations to create a comprehensive record of your child\'s growth.\n\n**Privacy First**: All memories are stored securely with end-to-end encryption. You control who sees your child\'s data.\n\n**Shareable Moments**: Create beautiful memory books to share with family, or keep them private for your own reflection.'
      },
      {
        type: 'text',
        value: 'Parents who beta-tested Baseul Memory reported feeling more connected to their child\'s development and better able to communicate progress with educators and healthcare providers. Join thousands of families already using Baseul Memory to celebrate every step of the journey.'
      }
    ]
  },
  {
    id: 'blog_3',
    title: '10 Tips for Supporting Your Toddler\'s Language Development',
    excerpt: 'Practical strategies backed by research to help your child develop strong communication skills.',
    content: 'Language development is one of the most important...',
    published: true,
    createdAt: '2025-01-25T09:00:00Z',
    updatedAt: '2025-01-25T09:00:00Z',
    contentType: 'text',
    category: 'Parenting Tips',
    tags: ['language', 'communication', 'toddlers'],
    likes: 38,
    commentCount: 15,
    blocks: [
      {
        type: 'text',
        value: 'Language development is one of the most important milestones in early childhood. The foundation built during the toddler years influences literacy, social skills, and academic success for years to come. Here are ten evidence-based strategies to support your child\'s language journey:'
      },
      {
        type: 'text',
        value: '**1. Narrate Your Day**\nTalk through everyday activities. "Now we\'re putting on your blue shirt. Can you feel how soft it is?" This exposes children to new vocabulary in context.\n\n**2. Read Together Daily**\nMake reading a daily ritual. Choose interactive books and ask questions: "What do you think happens next?" "Can you find the red ball?"\n\n**3. Follow Their Lead**\nWhen your child shows interest in something, expand on it. If they point to a dog and say "dog," you might respond: "Yes! That\'s a big brown dog. The dog is running!"\n\n**4. Use Parentese**\nSpeak in a slightly higher pitch with exaggerated intonation. Research shows this actually helps language development more than baby talk.\n\n**5. Limit Screen Time**\nWhile some educational apps can help, nothing replaces real human interaction for language development.'
      },
      {
        type: 'text',
        value: '**6. Sing Songs and Recite Rhymes**\nRhythm and repetition in songs help children recognize language patterns and develop phonological awareness.\n\n**7. Ask Open-Ended Questions**\nInstead of yes/no questions, try: "What did you like about the park?" This encourages your child to formulate complete thoughts.\n\n**8. Expand Their Sentences**\nIf your child says "Want cookie," respond with: "You want a cookie? Would you like a chocolate cookie or an oatmeal cookie?"\n\n**9. Create Language-Rich Environments**\nLabel items around the house. Point out signs during outings. Make language visible and accessible.\n\n**10. Be Patient**\nEvery child develops at their own pace. Celebrate small victories and provide a supportive, low-pressure environment for language exploration.'
      },
      {
        type: 'text',
        value: 'Remember, you are your child\'s first and most important teacher. The conversations you have today are building the foundation for a lifetime of communication. If you have concerns about your child\'s language development, don\'t hesitate to consult with a pediatrician or speech therapist.'
      }
    ]
  },
  {
    id: 'blog_4',
    title: 'Creating a Montessori-Inspired Learning Space at Home',
    excerpt: 'Transform any room into a child-centered environment that promotes independence and discovery.',
    content: 'The Montessori method emphasizes child-led learning...',
    published: true,
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-02-01T11:00:00Z',
    contentType: 'image-text',
    category: 'Learning Environments',
    tags: ['montessori', 'home-setup', 'independence'],
    likes: 45,
    commentCount: 10,
    blocks: [
      {
        type: 'text',
        value: 'The Montessori method emphasizes child-led learning in carefully prepared environments. While Montessori schools offer specialized setups, you can incorporate these principles at home with simple, thoughtful changes.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1596066190600-3af9aadaaea1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb250ZXNzb3JpJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzY0NDI4MjU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'A well-organized, child-accessible learning space'
      },
      {
        type: 'text',
        value: '**Key Principles:**\n\n**Child-Height Everything**: Place shelves, hooks, and furniture at your child\'s level. When children can access materials independently, they develop confidence and decision-making skills.\n\n**Order and Beauty**: Montessori spaces are organized and aesthetically pleasing. Use baskets, trays, and clear containers to keep materials tidy and inviting.\n\n**Less is More**: Rotate toys and materials instead of displaying everything at once. This reduces overwhelm and helps children focus.\n\n**Real Tools**: Whenever safe, provide real versions of items rather than toy versions. Real pitchers, small brooms, and child-safe knives for cooking help children feel capable.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc2NDQyODI1Nnww&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Practical life activities promote independence'
      },
      {
        type: 'text',
        value: '**Practical Implementation:**\n\nStart small. You don\'t need to renovate your entire home. Begin with one area:\n\n• A low shelf with a few carefully chosen activities\n• A small table and chair for independent work\n• A coat hook at your child\'s height\n• A step stool for sink access\n\nObserve your child\'s interests and rotate materials accordingly. The goal is to create an environment where your child can explore, learn, and grow with minimal adult intervention.'
      },
      {
        type: 'text',
        value: 'At Baseul Kids, we believe in supporting diverse learning approaches. Whether you embrace Montessori principles fully or just incorporate elements, creating a child-centered space shows your child that their independence and interests matter.'
      }
    ]
  },
  {
    id: 'blog_5',
    title: 'The Role of Play in Cognitive Development',
    excerpt: 'Why play isn\'t just fun—it\'s essential brain work for growing children.',
    content: 'Play is often dismissed as mere entertainment...',
    published: true,
    createdAt: '2025-02-10T10:30:00Z',
    updatedAt: '2025-02-10T10:30:00Z',
    contentType: 'text',
    category: 'Child Development',
    tags: ['play', 'cognitive-development', 'learning'],
    likes: 51,
    commentCount: 14,
    blocks: [
      {
        type: 'text',
        value: 'Play is often dismissed as mere entertainment, but neuroscience reveals it\'s actually serious business for developing brains. When children play, they\'re building neural pathways, developing executive function skills, and learning to navigate social and emotional challenges.'
      },
      {
        type: 'text',
        value: '**Types of Play and Their Benefits:**\n\n**Symbolic Play** (pretending, role-play)\nDevelops abstract thinking, creativity, and emotional regulation. When a child pretends a block is a phone, they\'re practicing symbolic representation—the same skill needed for reading and math.\n\n**Physical Play** (running, climbing, dancing)\nBuilds motor skills, spatial awareness, and risk assessment. Physical play also releases neurotransmitters that enhance learning and mood.\n\n**Constructive Play** (building, creating)\nPromotes problem-solving, planning, and persistence. Children learn cause and effect through trial and error.\n\n**Games with Rules**\nTeach self-regulation, fairness, and strategic thinking. Even simple games like "Red Light, Green Light" build impulse control.'
      },
      {
        type: 'text',
        value: '**Supporting Healthy Play:**\n\nParents and educators can maximize play\'s benefits:\n\n• Provide unstructured time for child-directed play\n• Offer open-ended materials (blocks, art supplies, natural objects)\n• Join in occasionally but follow your child\'s lead\n• Resist the urge to "teach" during play—learning happens naturally\n• Create safe spaces for physical play and risk-taking\n• Limit screen time to preserve time for active play'
      },
      {
        type: 'text',
        value: 'Research consistently shows that children who engage in rich, varied play develop better problem-solving skills, creativity, and social competence. In our achievement-oriented culture, it\'s tempting to prioritize structured learning over play. But science tells us that play IS the work of childhood—and it\'s work that pays lifelong dividends.'
      }
    ]
  },
  {
    id: 'blog_6',
    title: 'Building Emotional Intelligence in Early Childhood',
    excerpt: 'Practical approaches to help children recognize, understand, and manage their emotions.',
    content: 'Emotional intelligence—the ability to recognize...',
    published: true,
    createdAt: '2025-02-15T13:00:00Z',
    updatedAt: '2025-02-15T13:00:00Z',
    contentType: 'image-text',
    category: 'Parenting Tips',
    tags: ['emotional-intelligence', 'social-skills', 'parenting'],
    likes: 63,
    commentCount: 18,
    blocks: [
      {
        type: 'text',
        value: 'Emotional intelligence—the ability to recognize, understand, and manage emotions—is increasingly recognized as crucial for success and wellbeing. The good news? The foundation for emotional intelligence is built during early childhood, and parents play the most important role.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1763013259118-ffbc78b2bdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBjaGlsZCUyMGJvbmRpbmd8ZW58MXx8fHwxNzY0MzUyOTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Supporting children through emotional experiences'
      },
      {
        type: 'text',
        value: '**Core Components of Emotional Intelligence:**\n\n1. **Self-Awareness**: Recognizing one\'s own emotions\n2. **Self-Regulation**: Managing emotional responses\n3. **Motivation**: Using emotions to achieve goals\n4. **Empathy**: Understanding others\' emotions\n5. **Social Skills**: Navigating relationships effectively'
      },
      {
        type: 'text',
        value: '**Strategies for Building EQ:**\n\n**Name Emotions**\n"I can see you\'re feeling frustrated because the tower fell down." Labeling emotions helps children recognize and understand their feelings.\n\n**Validate Feelings**\n"It\'s okay to feel sad when your friend can\'t play." Validation doesn\'t mean permitting all behaviors, but it acknowledges emotions are real and acceptable.\n\n**Model Emotional Regulation**\n"I\'m feeling angry right now, so I\'m going to take some deep breaths." Children learn more from what we do than what we say.\n\n**Teach Coping Strategies**\nIntroduce age-appropriate tools: deep breathing, counting to ten, drawing feelings, or talking about emotions.'
      },
      {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1758624723522-7e9f9313386e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMGRldmVsb3BtZW50JTIwYWN0aXZpdHl8ZW58MXx8fHwxNzY0NDI4MjU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Children learning to express and manage emotions'
      },
      {
        type: 'text',
        value: '**Reading Books About Emotions**\nStories provide safe ways to explore complex feelings. Discuss characters\' emotions and choices.\n\n**Create an Emotion-Friendly Environment**\nMake it safe to express all emotions. A "feelings corner" with pillows, books, and calming activities gives children a space to process emotions.\n\nBuilding emotional intelligence is a gradual process. Be patient with your child—and yourself. Every conversation about feelings is an investment in your child\'s future wellbeing and success.'
      }
    ]
  }
];

// Helper function to initialize blogs in localStorage if not present
export function initializeBlogsIfNeeded() {
  const existingBlogs = localStorage.getItem('baseul_admin_blogs');
  if (!existingBlogs) {
    localStorage.setItem('baseul_admin_blogs', JSON.stringify(initialBlogs));
    return initialBlogs;
  }
  return JSON.parse(existingBlogs);
}
