import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Users, BarChart3, Trophy, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * Landing Page Component
 * Modern landing page with animations and proper branding
 */
const LandingPage = () => {
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Track Every Frame",
      description: "Record every pin, every ball, every game. Get detailed insights into your bowling performance."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analyze Trends",
      description: "Visualize your progress over time with beautiful charts and comprehensive statistics."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Set Goals",
      description: "Create and track personal goals. Watch yourself improve game after game."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Connect with Friends",
      description: "Challenge friends, share achievements, and build a bowling community."
    }
  ];

  const benefits = [
    "Pin-by-pin tracking for detailed analysis",
    "Ball arsenal management and maintenance logs",
    "Split detection and pin carry analysis",
    "Oil pattern tracking for optimal ball selection",
    "Performance trends and predictions",
    "Social features to compete with friends"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-teal-50 to-cream-100">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-retro">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-charcoal-900 font-heading">PinStats</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-charcoal-600 hover:text-teal-600 transition-colors font-medium">
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
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium animate-bounce-subtle">
              <Sparkles className="w-4 h-4" />
              <span>The Ultimate Bowling Tracker</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-charcoal-900 font-heading leading-tight animate-slide-up">
              Track. Analyze.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-coral-500">
                Dominate the Lanes.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-charcoal-600 max-w-3xl mx-auto animate-slide-up animation-delay-200">
              PinStats is your personal bowling coach. Track every frame, analyze your performance, 
              and watch your average soar to new heights.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-400">
              <Link to="/register">
                <Button variant="primary" size="lg" className="group">
                  Start Tracking Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg">
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-sm text-charcoal-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-500" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-500" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-500" />
                <span>Unlimited Games</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              Powerful features designed for bowlers who want to take their game to the next level
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-cream-50 to-white rounded-3xl shadow-retro hover:shadow-retro-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-retro">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-charcoal-900 mb-3 font-heading">
                  {feature.title}
                </h3>
                <p className="text-charcoal-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold font-heading">
                Why Bowlers Love PinStats
              </h2>
              <p className="text-xl text-teal-50">
                Join thousands of bowlers who have improved their game with data-driven insights
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle className="w-6 h-6 text-coral-300 flex-shrink-0 mt-1" />
                    <span className="text-lg text-teal-50">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 space-y-6 animate-float">
                <div className="bg-white/20 rounded-2xl p-6">
                  <div className="text-5xl font-bold mb-2">250+</div>
                  <div className="text-teal-100">Average Score Improvement</div>
                </div>
                <div className="bg-white/20 rounded-2xl p-6">
                  <div className="text-5xl font-bold mb-2">15+</div>
                  <div className="text-teal-100">Pins Per Game Increase</div>
                </div>
                <div className="bg-white/20 rounded-2xl p-6">
                  <div className="text-5xl font-bold mb-2">98%</div>
                  <div className="text-teal-100">User Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-coral-500 to-coral-600 rounded-3xl p-12 text-center text-white shadow-retro-lg">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Ready to Improve Your Game?
            </h2>
            <p className="text-xl text-coral-50 mb-8 max-w-2xl mx-auto">
              Join PinStats today and start tracking your way to higher scores. 
              It's completely free, no strings attached.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-coral-600 hover:bg-cream-50">
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

export default LandingPage;
