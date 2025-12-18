import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { motion } from "framer-motion";
import LiveProofWidget from "@/components/live-proof/LiveProofWidget";

export default function ProofCenterHero() {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Live AI Governance in Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            See real-time evidence of responsible AI governance - updated every 30 seconds
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6">
              <Eye className="mr-2 h-5 w-5" /> Watch Live Feed
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Download className="mr-2 h-5 w-5" /> Download Evidence Pack
            </Button>
          </div>
        </motion.div>
        
        {/* Large LiveProofWidget */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="max-w-5xl mx-auto">
            <LiveProofWidget className="transform scale-110" refreshInterval={30000} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}