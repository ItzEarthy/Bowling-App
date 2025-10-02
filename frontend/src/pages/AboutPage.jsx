import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Heart, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * About Page Component
 * Information about PinStats, our mission, and what we do
 */
const AboutPage = () => {
  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Data-Driven Excellence",
      description: "We believe every bowler deserves access to professional-grade analytics. Our platform provides the insights you need to understand your game at a deeper level."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion for Bowling",
      description: "Built by bowlers, for bowlers. We understand the sport because we live it. Every feature is designed with the bowler's experience in mind."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community First",
      description: "Bowling is better together. We're building a community where bowlers can connect, compete, and grow their skills alongside friends."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Continuous Improvement",
      description: "Just like your bowling game, we're always evolving. We listen to our users and constantly improve the platform to meet your needs."
    }
  ];

  const milestones = [
    { year: "2024", title: "Project Launch", description: "PinStats was born from a simple idea: make bowling analytics accessible to everyone." },
    { year: "2024", title: "Pin Tracking", description: "Released advanced pin-by-pin tracking for detailed performance analysis." },
    { year: "2025", title: "Social Features", description: "Added friend challenges and leaderboards to build community." },
    { year: "2025", title: "Growing Strong", description: "Continuing to add features based on bowler feedback and requests." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-teal-50 to-cream-100">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-retro">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-charcoal-900 font-heading">PinStats</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-teal-600 font-semibold">
              About
            </Link>
            <Link to="/features" className="text-charcoal-600 hover:text-teal-600 transition-colors font-medium">
              Features
            </Link>
            <Link to="/contact" className="text-charcoal-600 hover:text-teal-600 transition-colors font-medium">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-charcoal-900 font-heading mb-6 animate-slide-up">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-coral-500">PinStats</span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal-600 leading-relaxed animate-slide-up animation-delay-200">
            We're on a mission to help every bowler reach their full potential through 
            powerful analytics and a supportive community.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading">
                Our Mission
              </h2>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                PinStats was created to bridge the gap between recreational and professional 
                bowling analytics. We believe that every bowler, regardless of skill level, 
                should have access to the same powerful tracking and analysis tools used by the pros.
              </p>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                Our platform goes beyond simple score tracking. We analyze every aspect of 
                your game—from pin carry and spare conversions to ball performance and lane 
                conditions—giving you actionable insights to improve your skills.
              </p>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                Whether you're bowling in a competitive league or just enjoying a night out 
                with friends, PinStats helps you understand your game, celebrate your progress, 
                and achieve your bowling goals.
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-teal-100 to-coral-100 rounded-3xl p-8 space-y-6 shadow-retro-lg">
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="text-4xl font-bold text-teal-600 mb-2">10,000+</div>
                  <div className="text-charcoal-600">Games Tracked</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="text-4xl font-bold text-coral-600 mb-2">500+</div>
                  <div className="text-charcoal-600">Active Bowlers</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="text-4xl font-bold text-teal-600 mb-2">25+</div>
                  <div className="text-charcoal-600">Average Pin Increase</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              Our core values guide everything we do at PinStats
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-3xl shadow-retro hover:shadow-retro-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-retro">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-charcoal-900 mb-3 font-heading">
                  {value.title}
                </h3>
                <p className="text-charcoal-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-charcoal-900 to-charcoal-800 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-charcoal-300">
              From concept to the platform you use today
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-8 items-start"
              >
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-2xl font-bold text-teal-400">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-teal-500 rounded-full mt-2 shadow-lg shadow-teal-500/50"></div>
                <div className="flex-1 pb-8">
                  <h3 className="text-2xl font-bold mb-2 font-heading">{milestone.title}</h3>
                  <p className="text-charcoal-300">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-charcoal-600">
              We use cutting-edge tools to deliver a fast, reliable, and delightful experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-cream-50 to-white rounded-2xl shadow-retro text-center">
              <div className="text-4xl mb-3">⚛️</div>
              <h3 className="font-bold text-charcoal-900 mb-2">React</h3>
              <p className="text-sm text-charcoal-600">Modern UI framework</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-cream-50 to-white rounded-2xl shadow-retro text-center">
              <div className="text-4xl mb-3">🟢</div>
              <h3 className="font-bold text-charcoal-900 mb-2">Node.js</h3>
              <p className="text-sm text-charcoal-600">Powerful backend</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-cream-50 to-white rounded-2xl shadow-retro text-center">
              <div className="text-4xl mb-3">🐳</div>
              <h3 className="font-bold text-charcoal-900 mb-2">Docker</h3>
              <p className="text-sm text-charcoal-600">Containerized deployment</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-12 text-center text-white shadow-retro-lg">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Join the PinStats Community
            </h2>
            <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
              Start your journey to better bowling today. It's free, easy, and takes less than a minute.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-teal-600 hover:bg-cream-50">
                Create Your Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal-900 text-charcoal-300 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white font-heading">PinStats</span>
              </div>
              <p className="text-sm">
                Your personal bowling analytics platform. Track, analyze, and dominate.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-teal-400 transition-colors">Features</Link></li>
                <li><Link to="/about" className="hover:text-teal-400 transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-charcoal-700 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} PinStats. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
