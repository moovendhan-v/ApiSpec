'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image"
import {
  FileText,
  Lock,
  Share2,
  Zap,
  Code,
  Users,
  CheckCircle,
  ArrowRight,
  Globe,
  Shield,
  Sparkles,
  Rocket,
  GitBranch,
  Eye,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/apispec.png',
    '/api.png'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Create API Specifications',
      description: 'Build and document your OpenAPI specifications with an intuitive editor and JSON formatting tools.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Share2,
      title: 'Share Effortlessly',
      description: 'Share your API docs publicly or keep them private with password protection. Total control over visibility.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Code,
      title: 'Beautiful Documentation',
      description: 'Auto-generate stunning, interactive API documentation from your OpenAPI specs.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern tech for blazing fast performance. Edit, save, and share in seconds.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your specifications are encrypted and secure. Add password protection for sensitive APIs.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Collaborate',
      description: 'Manage multiple API specifications and share them with your team or the world.',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  const benefits = [
    'No more scattered API documentation',
    'Version control for your specifications',
    'Easy collaboration with team members',
    'Professional, branded documentation',
    'Export and import OpenAPI specs',
    'Real-time preview of changes',
  ];

  const stats = [
    { label: 'API Specifications', value: '10K+', icon: FileText },
    { label: 'Active Users', value: '2.5K+', icon: Users },
    { label: 'Countries', value: '50+', icon: Globe },
    { label: 'Uptime', value: '99.9%', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>The Modern API Documentation Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Document APIs.
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Share Knowledge.
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Build Better.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            The all-in-one SaaS platform for creating, managing, and sharing OpenAPI specifications.
            Collaborate with your team and deliver exceptional API documentation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 group">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/documents">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Live Demo
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Unlimited specifications</span>
            </div>
          </motion.div>

          {/* Animated Dashboard Preview with Image Slider */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="relative rounded-xl border-2 bg-card p-4 shadow-2xl max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="relative overflow-hidden rounded-lg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`Dashboard Preview ${currentImageIndex + 1}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Image Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${idx === currentImageIndex
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30'
                      }`}
                    animate={{
                      scale: idx === currentImageIndex ? 1.2 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful SaaS features designed for modern API teams
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onHoverStart={() => setHoveredFeature(idx)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all h-full group">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                    animate={{
                      scale: hoveredFeature === idx ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <CardHeader>
                    <motion.div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple 3-Step Process</h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes, scale to millions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Lines */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {[
              { num: 1, title: 'Sign Up', desc: 'Create your account in 30 seconds. Start with our free forever plan.', icon: Users },
              { num: 2, title: 'Create Specs', desc: 'Import existing specs or build new ones with our powerful editor.', icon: Code },
              { num: 3, title: 'Share & Scale', desc: 'Publish beautiful documentation and collaborate with your team.', icon: Share2 },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="text-center relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg relative z-10"
                >
                  {step.num}
                </motion.div>
                <step.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose API Specs?</h2>
            <p className="text-xl text-muted-foreground">
              Built for developers, loved by teams
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:border-primary/50 transition-all cursor-pointer"
              >
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <CardContent className="pt-12 pb-12 text-center relative z-10">
                <Rocket className="w-16 h-16 mx-auto mb-6 text-primary" />
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Transform Your API Documentation?
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join thousands of developers already using API Specs
                </p>
                <Link href="/auth/signin">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="text-lg px-12">
                      Start Free Today
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                </Link>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card • Unlimited specs • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                API Specs
              </h3>
              <p className="text-sm text-muted-foreground">
                The modern SaaS platform for managing OpenAPI specifications and API documentation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/documents" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/createdoc" className="hover:text-foreground transition-colors">Create Spec</Link></li>
                {/* <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li> */}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="https://profile.cybertechmind.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://profile.cybertechmind.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.cybertechmind.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
              </ul>

            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link target="_blank" rel="noopener noreferrer" href="https://www.cybertechmind.com/p/privacy-policy.html" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link target="_blank" rel="noopener noreferrer" href="https://www.cybertechmind.com/p/privacy-policy.html" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link target="_blank" rel="noopener noreferrer" href="https://www.cybertechmind.com/p/privacy-policy.html" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} API Specs. All rights reserved. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}