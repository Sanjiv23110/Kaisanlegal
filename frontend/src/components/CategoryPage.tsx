import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface CategoryPageProps {
  category: string;
  onBack: () => void;
  onActionSelect: (action: string) => void;
}

export function CategoryPage({ category, onBack, onActionSelect }: CategoryPageProps) {
  const categoryData: Record<string, { name: string; actions: Array<{ id: string; name: string; description: string; difficulty: 'Easy' | 'Medium' | 'Complex' }> }> = {
    business: {
      name: 'Business Law',
      actions: [
        { id: 'register-company', name: 'Register a Company', description: 'Incorporate your business legally', difficulty: 'Medium' },
        { id: 'annual-returns', name: 'File Annual Returns', description: 'Submit required yearly compliance documents', difficulty: 'Easy' },
        { id: 'trademark', name: 'Register Trademark', description: 'Protect your brand identity', difficulty: 'Medium' },
        { id: 'gst-registration', name: 'GST Registration', description: 'Register for Goods and Services Tax', difficulty: 'Easy' },
        { id: 'partnership-deed', name: 'Partnership Deed', description: 'Create legal partnership agreement', difficulty: 'Complex' },
        { id: 'business-license', name: 'Business License', description: 'Obtain required business permits', difficulty: 'Medium' }
      ]
    },
    property: {
      name: 'Property Law',
      actions: [
        { id: 'property-registration', name: 'Property Registration', description: 'Register property purchase/sale', difficulty: 'Complex' },
        { id: 'rent-agreement', name: 'Rent Agreement', description: 'Create legal rental contract', difficulty: 'Easy' },
        { id: 'property-dispute', name: 'Property Dispute', description: 'Resolve property ownership issues', difficulty: 'Complex' },
        { id: 'mutation', name: 'Property Mutation', description: 'Transfer property records', difficulty: 'Medium' },
        { id: 'encumbrance', name: 'Encumbrance Certificate', description: 'Get property transaction history', difficulty: 'Easy' }
      ]
    },
    criminal: {
      name: 'Criminal Law',
      actions: [
        { id: 'file-fir', name: 'File FIR', description: 'Register criminal complaint with police', difficulty: 'Medium' },
        { id: 'bail-application', name: 'Bail Application', description: 'Apply for bail in criminal case', difficulty: 'Complex' },
        { id: 'chargesheet', name: 'Understand Chargesheet', description: 'Comprehend criminal charges filed', difficulty: 'Medium' },
        { id: 'police-complaint', name: 'Police Complaint', description: 'File non-cognizable offense complaint', difficulty: 'Easy' }
      ]
    },
    family: {
      name: 'Family Law',
      actions: [
        { id: 'divorce', name: 'Divorce Proceedings', description: 'Legal separation process', difficulty: 'Complex' },
        { id: 'child-custody', name: 'Child Custody', description: 'Legal custody arrangements', difficulty: 'Complex' },
        { id: 'maintenance', name: 'Maintenance Claim', description: 'Spousal/child support proceedings', difficulty: 'Medium' },
        { id: 'adoption', name: 'Adoption Process', description: 'Legal child adoption procedures', difficulty: 'Complex' }
      ]
    },
    employment: {
      name: 'Employment Law',
      actions: [
        { id: 'wrongful-termination', name: 'Wrongful Termination', description: 'Challenge unlawful job dismissal', difficulty: 'Complex' },
        { id: 'wage-dispute', name: 'Wage & Salary Dispute', description: 'Recover unpaid wages or overtime', difficulty: 'Medium' },
        { id: 'workplace-harassment', name: 'Workplace Harassment', description: 'Report and address harassment claims', difficulty: 'Complex' },
        { id: 'employment-contract', name: 'Employment Contract Review', description: 'Understand your employment terms', difficulty: 'Medium' },
        { id: 'labor-complaint', name: 'Labor Law Complaint', description: 'File complaint with labor board', difficulty: 'Medium' },
        { id: 'workplace-discrimination', name: 'Workplace Discrimination', description: 'Address discrimination based on protected characteristics', difficulty: 'Complex' },
        { id: 'pf-gratuity', name: 'PF & Gratuity Claims', description: 'Claim provident fund and gratuity benefits', difficulty: 'Easy' },
        { id: 'maternity-leave', name: 'Maternity/Paternity Leave', description: 'Know your parental leave rights', difficulty: 'Easy' },
        { id: 'workplace-safety', name: 'Workplace Safety', description: 'Report unsafe working conditions', difficulty: 'Medium' },
        { id: 'bonus-disputes', name: 'Bonus & Benefits Dispute', description: 'Claim unpaid bonuses and benefits', difficulty: 'Medium' },
        { id: 'work-hours', name: 'Working Hours Violation', description: 'Address excessive working hours issues', difficulty: 'Easy' },
        { id: 'retrenchment', name: 'Retrenchment & Layoffs', description: 'Understand rights during job cuts', difficulty: 'Complex' }
      ]
    },
    motor: {
      name: 'Motor Vehicle',
      actions: [
        { id: 'traffic-violation', name: 'Contest Traffic Violation', description: 'Challenge traffic fines and penalties', difficulty: 'Easy' },
        { id: 'driving-license', name: 'Driving License Issues', description: 'Renew, restore, or appeal license suspension', difficulty: 'Medium' },
        { id: 'vehicle-registration', name: 'Vehicle Registration', description: 'Register new or transfer vehicle ownership', difficulty: 'Medium' },
        { id: 'accident-claim', name: 'Accident Insurance Claim', description: 'File motor accident insurance claims', difficulty: 'Complex' },
        { id: 'vehicle-insurance', name: 'Insurance Dispute', description: 'Resolve vehicle insurance disputes', difficulty: 'Medium' },
        { id: 'vehicle-theft', name: 'Vehicle Theft FIR', description: 'Report and recover stolen vehicle', difficulty: 'Medium' },
        { id: 'hit-and-run', name: 'Hit and Run Case', description: 'Legal steps for hit and run incidents', difficulty: 'Complex' },
        { id: 'dui-case', name: 'DUI/Drunk Driving', description: 'Handle drunk driving charges', difficulty: 'Complex' }
      ]
    },
    contracts: {
      name: 'Contracts',
      actions: [
        { id: 'draft-contract', name: 'Draft a Contract', description: 'Create legally binding agreement', difficulty: 'Medium' },
        { id: 'review-contract', name: 'Contract Review', description: 'Analyze contract terms and conditions', difficulty: 'Easy' },
        { id: 'breach-of-contract', name: 'Breach of Contract', description: 'Handle contract violations and claims', difficulty: 'Complex' },
        { id: 'terminate-contract', name: 'Contract Termination', description: 'Legally exit from contract obligations', difficulty: 'Medium' },
        { id: 'nda-agreement', name: 'Non-Disclosure Agreement', description: 'Create or enforce confidentiality agreements', difficulty: 'Easy' },
        { id: 'service-agreement', name: 'Service Agreement', description: 'Draft freelance or vendor contracts', difficulty: 'Medium' },
        { id: 'contract-dispute', name: 'Contract Dispute Resolution', description: 'Resolve contractual disagreements', difficulty: 'Complex' },
        { id: 'contract-amendment', name: 'Contract Amendment', description: 'Modify existing contract terms', difficulty: 'Easy' }
      ]
    }
  };

  const currentCategory = categoryData[category];
  
  if (!currentCategory) {
    return (
      <div className="pt-20 p-6 pb-8">
        <div className="max-w-md mx-auto text-center">
          <p>Category not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Categories
          </Button>
          <h1 className="text-4xl font-bold mb-3">{currentCategory.name}</h1>
          <p className="text-lg text-blue-100">Select an action to view detailed step-by-step guidance</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCategory.actions.map((action) => (
            <Card 
              key={action.id}
              className="p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-primary"
              onClick={() => onActionSelect(action.id)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg pr-2">{action.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDifficultyColor(action.difficulty)}`}>
                    {action.difficulty}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex-1 mb-4">{action.description}</p>
                <div className="flex items-center text-primary font-medium text-sm">
                  View Roadmap
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Info Banner */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <div>
              <p className="font-semibold text-blue-900 mb-1">Getting Started</p>
              <p className="text-sm text-blue-800">
                Start with "Easy" level actions to familiarize yourself with legal processes. Each action provides detailed step-by-step guidance, required documents, estimated costs, and timelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}