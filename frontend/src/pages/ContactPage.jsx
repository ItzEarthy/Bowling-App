import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Mail, MessageSquare, Send, MapPin, Phone, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Contact Page Component
 * Contact information and message form
 */
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      content: "support@pinstats.app",
      description: "We'll respond within 24 hours"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      content: "Available 9am-5pm EST",
      description: "Get instant help from our team"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location",
      content: "Remote-First Team",
      description: "Serving bowlers worldwide"
    }
  ];

  const faqs = [
    {
      question: "Is PinStats really free?",
      answer: "Yes! PinStats is completely free to use with no hidden fees or premium tiers. We believe every bowler deserves access to quality analytics."
    },
    {
      question: "Do I need to download an app?",
      answer: "PinStats works right in your browser! We're working on native mobile apps, but the web version works great on all devices."
    },
    {
      question: "Can I import my existing bowling data?",
      answer: "We're working on data import features. Contact us if you have a specific format you'd like to import."
    },
    {
      question: "How do you protect my data?",
      answer: "We use industry-standard encryption and never share your personal information. Your bowling data is secure and private."
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
            <Link to="/features" className="text-charcoal-600 hover:text-teal-600 transition-colors font-medium">
              Features
            </Link>
            <Link to="/contact" className="text-teal-600 font-semibold">
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
            Get in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-coral-500">
              Touch
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal-600 leading-relaxed animate-slide-up animation-delay-200">
            Have questions? Feedback? We'd love to hear from you. 
            Our team is here to help!
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-cream-50 to-white rounded-3xl shadow-retro hover:shadow-retro-lg transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-retro">
                  {method.icon}
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 mb-2 font-heading">
                  {method.title}
                </h3>
                <p className="text-lg text-teal-600 font-semibold mb-2">
                  {method.content}
                </p>
                <p className="text-sm text-charcoal-600">
                  {method.description}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-retro-lg p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 font-heading mb-4">
                  Send Us a Message
                </h2>
                <p className="text-charcoal-600">
                  Fill out the form below and we'll get back to you as soon as possible
                </p>
              </div>

              {isSubmitted && (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 animate-slide-up">
                  <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <p className="text-teal-700 font-medium">
                    Thank you! We've received your message and will respond soon.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-charcoal-700 font-medium mb-2">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-charcoal-700 font-medium mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-charcoal-700 font-medium mb-2">
                    Subject
                  </label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-charcoal-700 font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 font-heading mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-charcoal-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-retro p-6 hover:shadow-retro-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-bold text-charcoal-900 mb-3 font-heading">
                  {faq.question}
                </h3>
                <p className="text-charcoal-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-charcoal-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <a href="mailto:support@pinstats.app">
              <Button variant="outline" size="lg">
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-12 text-center text-white shadow-retro-lg">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Ready to Start Tracking?
            </h2>
            <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
              Join PinStats today and take your bowling to the next level. 
              No credit card required.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-teal-600 hover:bg-cream-50">
                Create Your Free Account
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

export default ContactPage;
