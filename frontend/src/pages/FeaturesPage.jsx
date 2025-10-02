import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BarChart3, TrendingUp, Target, Users, Activity, Sparkles, Zap, Clock, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * Features Page Component
 * Comprehensive overview of all PinStats features
 */
const FeaturesPage = () => {
  const coreFeatures = [
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Multiple Entry Modes",
      description: "Choose how you track your games",
      features: [
        "Pin-by-pin tracking for maximum detail",
        "Frame-by-frame for quick entry",
        "Final score for casual games",
        "Flexible data entry that fits your style"
      ]
    },
    {
      icon: <Activity className="w-10 h-10" />,
      title: "Pin Carry Analysis",
      description: "Understand how pins fall",
      features: [
        "Visual pin diagrams for every shot",
        "Split detection and classification",
        "Pin carry patterns and trends",
        "Pocket hit percentage tracking"
      ]
    },
    {
      icon: <TrendingUp className="w-10 h-10" />,
      title: "Advanced Statistics",
      description: "Deep insights into your performance",
      features: [
        "Rolling averages over time",
        "Strike and spare percentages",
        "First ball and fill ball analysis",
        "Consistency metrics and trends"
      ]
    },
    {
      icon: <Trophy className="w-10 h-10" />,
      title: "Ball Arsenal Management",
      description: "Track your bowling balls",
      features: [
        "Detailed ball specifications",
        "Surface and layout tracking",
        "Maintenance logs and schedules",
        "Performance metrics per ball"
      ]
    },
    {
      icon: <Target className="w-10 h-10" />,
      title: "Goal Setting",
      description: "Set and achieve targets",
      features: [
        "Custom personal goals",
        "Progress tracking visualization",
        "Milestone celebrations",
        "Motivational reminders"
      ]
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Social Features",
      description: "Connect with other bowlers",
      features: [
        "Friend system and challenges",
        "Shared games and comparisons",
        "Leaderboards and rankings",
        "Friendly competition tracking"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Oil Pattern Tracking",
      description: "Record lane conditions and how they affect your game"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Scoring",
      description: "Automatic score calculation as you enter data"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Game History",
      description: "Access your complete bowling history anytime"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is encrypted and never shared without permission"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Beautiful Visualizations",
      description: "Charts and graphs that make data easy to understand"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Trend Analysis",
      description: "Identify patterns and predict future performance"
    }
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
            <Link to="/about" className="text-charcoal-600 hover:text-teal-600 transition-colors font-medium">
              About
            </Link>
            <Link to="/features" className="text-teal-600 font-semibold">
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
          <div className="inline-flex items-center space-x-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-charcoal-900 font-heading mb-6 animate-slide-up">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-coral-500">
              Master Your Game
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal-600 leading-relaxed animate-slide-up animation-delay-200">
            From basic score tracking to advanced analytics, PinStats has all the 
            tools you need to improve your bowling.
          </p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              Core Features
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              The essential tools that make PinStats your ultimate bowling companion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-cream-50 to-white rounded-3xl shadow-retro hover:shadow-retro-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-retro">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-charcoal-900 mb-2 font-heading">
                  {feature.title}
                </h3>
                <p className="text-charcoal-600 mb-4 font-medium">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              And Much More
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              Additional features to enhance your bowling experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-retro hover:shadow-retro-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-coral-500 to-coral-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-retro">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 mb-2 font-heading">
                  {feature.title}
                </h3>
                <p className="text-charcoal-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight - Data Entry */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Flexible Data Entry</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading">
                Track Games Your Way
              </h2>
              <p className="text-xl text-teal-50 leading-relaxed">
                Whether you want quick entry or detailed analysis, PinStats adapts to your needs. 
                Switch between modes instantly and never lose data.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-coral-300 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-lg mb-1">Pin-by-Pin Mode</div>
                    <div className="text-teal-50">Perfect for serious analysis and split detection</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-coral-300 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-lg mb-1">Frame-by-Frame Mode</div>
                    <div className="text-teal-50">Quick entry while maintaining accuracy</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-coral-300 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-lg mb-1">Final Score Mode</div>
                    <div className="text-teal-50">Just enter the final score for casual games</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="font-bold text-charcoal-900">Detailed Analysis</div>
                  </div>
                  <div className="text-sm text-charcoal-600">
                    Track every pin, every shot, every detail
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-coral-600" />
                    </div>
                    <div className="font-bold text-charcoal-900">Quick Entry</div>
                  </div>
                  <div className="text-sm text-charcoal-600">
                    Fast input without sacrificing accuracy
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-retro">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="font-bold text-charcoal-900">Casual Tracking</div>
                  </div>
                  <div className="text-sm text-charcoal-600">
                    Log final scores in seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              Why Choose PinStats?
            </h2>
            <p className="text-xl text-charcoal-600">
              See how we compare to traditional scorekeeping
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gradient-to-br from-cream-100 to-cream-50 rounded-3xl">
              <h3 className="text-2xl font-bold text-charcoal-900 mb-6 font-heading">
                📝 Traditional Scorekeeping
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-charcoal-600">
                  <span className="text-red-500">✕</span>
                  <span>Manual calculations prone to errors</span>
                </li>
                <li className="flex items-start gap-2 text-charcoal-600">
                  <span className="text-red-500">✕</span>
                  <span>No historical data or trends</span>
                </li>
                <li className="flex items-start gap-2 text-charcoal-600">
                  <span className="text-red-500">✕</span>
                  <span>Paper scores get lost or damaged</span>
                </li>
                <li className="flex items-start gap-2 text-charcoal-600">
                  <span className="text-red-500">✕</span>
                  <span>Limited insights into performance</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-3xl shadow-retro-lg">
              <h3 className="text-2xl font-bold mb-6 font-heading">
                🎯 PinStats
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-coral-300 flex-shrink-0 mt-0.5" />
                  <span>Automatic scoring and calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-coral-300 flex-shrink-0 mt-0.5" />
                  <span>Complete game history forever</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-coral-300 flex-shrink-0 mt-0.5" />
                  <span>Cloud sync across all devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-coral-300 flex-shrink-0 mt-0.5" />
                  <span>Deep analytics and actionable insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-coral-500 to-coral-600 rounded-3xl p-12 text-center text-white shadow-retro-lg">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Ready to Experience PinStats?
            </h2>
            <p className="text-xl text-coral-50 mb-8 max-w-2xl mx-auto">
              Join bowlers who are already improving their game with powerful analytics.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-coral-600 hover:bg-cream-50">
                Start Tracking for Free
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

export default FeaturesPage;
