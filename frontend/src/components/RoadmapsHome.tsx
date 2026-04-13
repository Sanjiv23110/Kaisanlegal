import { Building2, Home as HomeIcon, Gavel, Heart, Car, FileText, Shield, Users, Scale, BookOpen, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";

interface RoadmapsHomeProps {
  onCategorySelect: (category: string) => void;
}

export function RoadmapsHome({ onCategorySelect }: RoadmapsHomeProps) {
  const categories = [
    { id: 'business', name: 'Business Law', icon: Building2, color: 'bg-blue-50 hover:bg-blue-100 border-blue-200', iconColor: 'text-blue-600', description: 'Starting and running a business' },
    { id: 'property', name: 'Property Law', icon: HomeIcon, color: 'bg-green-50 hover:bg-green-100 border-green-200', iconColor: 'text-green-600', description: 'Real estate and landlord-tenant issues' },
    { id: 'criminal', name: 'Criminal Law', icon: Gavel, color: 'bg-red-50 hover:bg-red-100 border-red-200', iconColor: 'text-red-600', description: 'Understanding criminal proceedings' },
    { id: 'family', name: 'Family Law', icon: Heart, color: 'bg-pink-50 hover:bg-pink-100 border-pink-200', iconColor: 'text-pink-600', description: 'Marriage, divorce, and custody' },
    { id: 'motor', name: 'Motor Vehicle', icon: Car, color: 'bg-purple-50 hover:bg-purple-100 border-purple-200', iconColor: 'text-purple-600', description: 'Accidents and vehicle disputes' },
    { id: 'contracts', name: 'Contracts', icon: FileText, color: 'bg-orange-50 hover:bg-orange-100 border-orange-200', iconColor: 'text-orange-600', description: 'Understanding agreements and terms' },
    { id: 'consumer', name: 'Consumer Rights', icon: Shield, color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200', iconColor: 'text-cyan-600', description: 'Protection from unfair practices' },
    { id: 'employment', name: 'Employment', icon: Users, color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', iconColor: 'text-indigo-600', description: 'Workplace rights and disputes' }
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Scale size={48} className="mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold">LegalGuide AI</h1>
            </div>
            <p className="text-xl md:text-2xl mb-6 text-blue-100">
              Simplifying complex legal processes into clear, actionable guidance
            </p>
            <p className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto">
              Navigate legal challenges with confidence using AI-powered roadmaps, document analysis, and personalized legal assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <BookOpen className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold mb-1">Step-by-Step Roadmaps</h3>
                <p className="text-sm text-muted-foreground">Guided pathways for common legal situations</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="text-green-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold mb-1">Document Scanner</h3>
                <p className="text-sm text-muted-foreground">AI-powered analysis of legal documents</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="text-purple-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold mb-1">AI Legal Assistant</h3>
                <p className="text-sm text-muted-foreground">Personalized guidance for your situation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Explore Legal Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a category to access comprehensive guides, templates, and expert guidance
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${category.color}`}
                onClick={() => onCategorySelect(category.id)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-full bg-white/50`}>
                    <Icon size={32} className={category.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Important Legal Disclaimer</h4>
              <p className="text-sm text-amber-800">
                This tool provides general legal guidance and educational information. It is not a substitute for professional legal advice. 
                Always consult with a qualified attorney for advice specific to your situation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
