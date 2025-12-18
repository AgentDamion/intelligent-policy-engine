import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  Code, 
  BarChart3,
  FileText,
  Users,
  Cloud,
  Lock,
  Workflow,
  Settings,
  Palette,
  MessageSquare,
  Image,
  Sparkles,
  Search,
  Video,
  Building,
  FolderOpen,
  ClipboardList,
  Target,
  Calendar,
  Grid3X3,
  BookOpen
} from 'lucide-react';

const toolCategories = {
  creative: [
    { name: "Adobe Creative Suite", icon: Palette },
    { name: "Figma", icon: Shield },
    { name: "Canva", icon: Target },
    { name: "Sketch", icon: Sparkles },
    { name: "Framer", icon: Code },
    { name: "InVision", icon: Users },
    { name: "Principle", icon: Workflow },
    { name: "Adobe XD", icon: Palette }
  ],
  ai: [
    { name: "ChatGPT", icon: MessageSquare },
    { name: "Claude", icon: Brain },
    { name: "Midjourney", icon: Image },
    { name: "Jasper", icon: Sparkles },
    { name: "Gemini", icon: Zap },
    { name: "Perplexity", icon: Search },
    { name: "Runway", icon: Video },
    { name: "Stability AI", icon: Image }
  ],
  review: [
    { name: "Veeva Vault", icon: Building },
    { name: "SharePoint", icon: FolderOpen },
    { name: "Workfront", icon: ClipboardList },
    { name: "Asana", icon: Target },
    { name: "Monday.com", icon: BarChart3 },
    { name: "Smartsheet", icon: FileText },
    { name: "Airtable", icon: Grid3X3 },
    { name: "Notion", icon: BookOpen }
  ]
};

function ToolChip({ tool, delay = 0 }: { tool: { name: string; icon: any }, delay?: number }) {
  const IconComponent = tool.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={{ 
        opacity: [0.7, 1, 0.7],
        scale: [1, 1.02, 1]
      }}
      transition={{
        duration: 3,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="flex-shrink-0 bg-card border border-border rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-card hover:to-muted group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <IconComponent className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="font-medium text-foreground text-sm whitespace-nowrap">
          {tool.name}
        </span>
      </div>
    </motion.div>
  );
}

function ScrollingRow({ tools, direction = "left", speed = 30, delay = 0 }: { 
  tools: typeof toolCategories.creative;
  direction?: "left" | "right";
  speed?: number;
  delay?: number;
}) {
  const duplicatedTools = [...tools, ...tools, ...tools];
  
  return (
    <div className="overflow-hidden py-3">
      <motion.div
        animate={{
          x: direction === "left" ? [0, -1000] : [0, 1000]
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
          delay: delay
        }}
        className="flex gap-4 w-fit"
      >
        {duplicatedTools.map((tool, index) => (
          <ToolChip key={`${tool.name}-${index}`} tool={tool} delay={index * 0.1} />
        ))}
      </motion.div>
    </div>
  );
}

function CentralHub() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 40px hsl(var(--primary) / 0.3)",
            "0 0 60px hsl(var(--primary) / 0.4)",
            "0 0 80px hsl(var(--primary) / 0.3)",
            "0 0 60px hsl(var(--primary) / 0.4)",
            "0 0 40px hsl(var(--primary) / 0.3)"
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-64 h-64 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-1"
      >
        <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center text-center px-6">
          <div className="inline-block bg-background px-3 py-1 rounded-xl shadow-sm hover:shadow-xl border border-border hover:border-brand-teal/20 transition-all duration-300 text-brand-teal font-bold text-lg mb-3">
            aicomplyr.io
          </div>
          <div className="font-semibold text-foreground text-lg mb-2">
            Universal Hub
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            Governance • Audit Trails • Compliance
          </div>
        </div>
      </motion.div>
      
      {/* Connector lines */}
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 w-px h-16 bg-gradient-to-t from-primary to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 w-px h-16 bg-gradient-to-b from-secondary to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-0 transform -translate-x-8 -translate-y-1/2 h-px w-16 bg-gradient-to-l from-accent to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-1/2 right-0 transform translate-x-8 -translate-y-1/2 h-px w-16 bg-gradient-to-r from-primary to-transparent"
      />
    </div>
  );
}

const IntegrationHubCarousel = () => {
  return (
    <section className="py-16 lg:py-24 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            One Governance Backbone Across{' '}
            <span className="text-brand-teal">500+ Tools</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Seamlessly connect creative platforms, AI tools, and review systems through one compliance hub.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative h-80 lg:h-96 mb-16">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none z-20"></div>
          
          {/* Row 1 - Creative Tools */}
          <div className="absolute top-8">
            <ScrollingRow 
              tools={toolCategories.creative} 
              direction="left" 
              speed={40}
              delay={0}
            />
          </div>
          
          {/* Row 2 - AI Platforms */}
          <div className="absolute top-1/2 transform -translate-y-1/2">
            <ScrollingRow 
              tools={toolCategories.ai} 
              direction="right" 
              speed={35}
              delay={1}
            />
          </div>
          
          {/* Row 3 - Review Systems */}
          <div className="absolute bottom-8">
            <ScrollingRow 
              tools={toolCategories.review} 
              direction="left" 
              speed={45}
              delay={2}
            />
          </div>

          {/* Central Hub */}
          <CentralHub />
        </div>

        {/* Caption */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            <span className="text-brand-teal font-semibold">aicomplyr.io</span> is the only integration layer that unifies{" "}
            <span className="font-semibold text-brand-teal">creation</span> → <span className="font-semibold text-secondary">AI tools</span> → <span className="font-semibold text-accent">review</span> → <span className="font-semibold text-brand-teal">approval</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default IntegrationHubCarousel;