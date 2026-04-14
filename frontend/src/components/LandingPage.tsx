import { Scale, BookOpen, FileSearch, MessageCircle, Users, ArrowRight, CheckCircle, Shield, Zap, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import PricingCards from "./PricingCards";

export function LandingPage() {
  const navigate = useNavigate();

  const features = [

    {
      icon: FileSearch,
      title: "Document Scanner",
      description: "Upload and analyze legal documents using AI-powered OCR technology. Get instant insights, identify key clauses, and understand your contracts, agreements, and legal papers.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: MessageCircle,
      title: "AI Legal Assistant",
      description: "Chat with our intelligent AI assistant 24/7. Ask legal questions, get guidance on your specific situation, and receive personalized advice based on your needs.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Users,
      title: "Community Forum",
      description: "Connect with others facing similar legal challenges. Share experiences, ask questions, and verify community advice with AI-powered fact-checking.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  const benefits = [
    "Clear, jargon-free explanations",
    "Step-by-step guidance for legal processes",
    "AI-powered document analysis",
    "Community support and shared experiences",
    "Always cite sources and provide references",
    "Educational and empowering approach"
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Scale size={64} className="mr-4" />
              <h1 className="text-5xl md:text-6xl font-bold">LegalGuide AI</h1>
            </div>
            <p className="text-2xl md:text-3xl mb-6 text-blue-100 font-semibold">
              Simplifying Legal Complexity
            </p>
            <p className="text-lg md:text-xl text-blue-200 max-w-3xl mx-auto mb-10">
              Make informed legal decisions with AI-powered guidance. We transform complex legal documents 
              and processes into clear, accessible information that empowers you to take the right action.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 h-auto font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How LegalGuide AI Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines AI technology with legal expertise to guide you through your legal journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon size={28} className={feature.color} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose LegalGuide AI?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We believe legal information should be accessible, understandable, and actionable for everyone. 
                Our platform is designed with simplicity, trust, and education at its core.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <Zap className="text-yellow-600 mb-3" size={32} />
                <h3 className="font-semibold mb-2">Fast &amp; Efficient</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant answers and guidance whenever you need them
                </p>
              </Card>
              <Card className="p-6 bg-white">
                <Shield className="text-blue-600 mb-3" size={32} />
                <h3 className="font-semibold mb-2">Trustworthy</h3>
                <p className="text-sm text-muted-foreground">
                  All information is sourced from reliable legal resources
                </p>
              </Card>
              <Card className="p-6 bg-white">
                <BookOpen className="text-purple-600 mb-3" size={32} />
                <h3 className="font-semibold mb-2">Educational</h3>
                <p className="text-sm text-muted-foreground">
                  Learn and understand, not just follow instructions
                </p>
              </Card>
              <Card className="p-6 bg-white">
                <Users className="text-green-600 mb-3" size={32} />
                <h3 className="font-semibold mb-2">Community-Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Share experiences and learn from others
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-16">
        <PricingCards />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Scan your documents or chat with our AI assistant for immediate legal guidance
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/chatbot')}
            className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 h-auto font-semibold"
          >
            Try AI Legal Assistant
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Important Legal Disclaimer</h4>
              <p className="text-sm text-amber-800">
                LegalGuide AI provides general legal guidance and educational information. It is not a substitute for professional legal advice. 
                Always consult with a qualified attorney for advice specific to your situation. We do not collect personal identifiable information (PII) 
                or secure sensitive data. This platform is designed for educational purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
