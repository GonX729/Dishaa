import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Brain, 
  Target, 
  Award, 
  TrendingUp,
  Users,
  Star,
  Sparkles,
  Zap,
  Shield,
  Rocket
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze your skills and create personalized learning paths.',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: Target,
      title: 'Smart Career Guidance',
      description: 'Get data-driven recommendations for your ideal career path with real-time market insights.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Award,
      title: 'Certification Hub',
      description: 'Verify, manage, and showcase your professional certifications with blockchain verification.',
      gradient: 'from-cyan-500 to-teal-600'
    },
    {
      icon: TrendingUp,
      title: 'Resume Intelligence',
      description: 'AI-powered resume optimization that adapts to industry trends and ATS requirements.',
      gradient: 'from-teal-500 to-green-600'
    }
  ];

  const stats = [
    { number: '25K+', label: 'Career Transformations', icon: Rocket },
    { number: '15K+', label: 'Verified Certifications', icon: Shield },
    { number: '92%', label: 'Job Match Success Rate', icon: Target },
    { number: '98%', label: 'User Satisfaction', icon: Sparkles }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'TechCorp',
      content: 'Disha AI helped me transition from marketing to tech. The personalized learning path was exactly what I needed.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Data Scientist',
      company: 'DataFlow Inc',
      content: 'The AI-powered job recommendations were spot on. I landed my dream job within 2 months!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Manager',
      company: 'InnovateLabs',
      content: 'The certification verification feature saved me hours of manual work. Highly recommended!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10 p-12 mb-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 shadow-xl">
                <Zap className="text-white" size={48} />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Disha AI
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white">
              Your AI-Powered Career Architect
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Transform your professional journey with cutting-edge AI that understands your potential, 
              analyzes market trends, and creates personalized pathways to your dream career.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
              >
                Start Your Journey
                <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
              <Link
                to="/login"
                className="group inline-flex items-center px-10 py-5 backdrop-blur-sm bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-xl"
              >
                Sign In
                <Sparkles className="ml-3 group-hover:rotate-12 transition-transform" size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Intelligent Features for 
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
                Career Excellence
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by advanced AI and machine learning, our platform provides 
              comprehensive tools for modern career development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group backdrop-blur-md bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="text-white" size={40} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of professionals who've accelerated their careers
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="backdrop-blur-md bg-white/10 rounded-3xl p-8 text-center border border-white/20 hover:border-white/30 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="text-white" size={32} />
                  </div>
                  <div className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-gray-300 font-medium text-lg">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Your Journey to Success
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three simple steps powered by advanced AI to revolutionize your career trajectory
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="group backdrop-blur-md bg-white/5 rounded-3xl p-10 text-center border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-105">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-2xl group-hover:rotate-6 transition-transform duration-300">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                AI Profile Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Upload your resume and let our advanced AI analyze your skills, experience, 
                and career aspirations with precision.
              </p>
            </div>

            <div className="group backdrop-blur-md bg-white/5 rounded-3xl p-10 text-center border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:scale-105">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-2xl group-hover:rotate-6 transition-transform duration-300">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full opacity-60"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Smart Recommendations
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Receive personalized insights, course recommendations, and strategic 
                career pathways based on real-time market data.
              </p>
            </div>

            <div className="group backdrop-blur-md bg-white/5 rounded-3xl p-10 text-center border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:scale-105">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-2xl group-hover:rotate-6 transition-transform duration-300">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-60"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Career Acceleration
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Apply to perfectly matched opportunities with AI-optimized resumes 
                and comprehensive interview preparation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 bg-gradient-to-r from-slate-900 via-purple-900/30 to-slate-900">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real transformations from professionals who unlocked their potential with Disha AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group backdrop-blur-md bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 shadow-2xl">
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-200" size={24} />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Users className="text-white" size={28} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-16 border border-white/20 max-w-4xl mx-auto shadow-2xl">
            <div className="flex justify-center mb-8">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500 to-blue-500 shadow-2xl animate-pulse">
                <Rocket className="text-white" size={64} />
              </div>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Transform Your Future?
            </h2>
            <p className="text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join over 25,000 professionals who have revolutionized their careers with AI-powered insights. 
              Your next breakthrough is just one click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/profile"
                className="group inline-flex items-center px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-semibold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
              >
                Begin Your Transformation
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={28} />
              </Link>
              <div className="text-gray-300 text-sm">
                ✨ Free forever • No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/90 backdrop-blur-md text-white py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Disha AI</span>
                <p className="text-gray-400 text-sm">Career Intelligence Platform</p>
              </div>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p className="text-lg">&copy; 2024 Disha AI. All rights reserved.</p>
              <p className="mt-2 text-sm">Empowering careers through artificial intelligence.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
