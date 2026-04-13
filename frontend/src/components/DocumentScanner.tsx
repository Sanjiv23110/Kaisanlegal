import { useState } from "react";
import { Upload, FileText, Camera, AlertTriangle, CheckCircle, X, Eye, MessageCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { api } from "../lib/api";
import { useLegal } from "../context/LegalContext";
import { useNavigate } from "react-router-dom";

interface DocumentAnalysis {
  documentType: string;
  keyDetails: { label: string; value: string; status: 'ok' | 'missing' | 'warning' }[];
  summary: string;
  redFlags: string[];
  credibilityScore: number;
  suggestions: string[];
}

export function DocumentScanner() {
  const { setScannedDoc } = useLegal();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysis(null);
    setCompliance(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await api.analyzeLegalDocument(selectedFile);
      setAnalysis(result.document_analysis);
      setCompliance(result.legal_compliance);
      // Store structured context in LegalContext — only activated when user explicitly clicks the button
      setScannedDoc({
        fileName: selectedFile.name,
        summary: result.document_analysis.summary,
        redFlags: result.document_analysis.redFlags,
        complianceReport: result.legal_compliance.compliance_report,
      });
    } catch (err: any) {
      setError(err.message || "Failed to analyze document. Please ensure it's a valid clear document or PDF.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return null;
    const cleaned = text.replace(/#+\s*/g, '').trim();
    const parts = cleaned.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'missing': return <X size={16} className="text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'missing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-3">Document Scanner</h1>
            <p className="text-lg text-green-100">Upload legal documents to get AI-powered analysis, identify red flags, and receive actionable suggestions</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        {!selectedFile && !analysis && (
          <Card
            className={`p-12 border-2 border-dashed cursor-pointer transition-all duration-200 ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Upload size={64} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold mb-2">Upload Document</p>
                <p className="text-muted-foreground">Drag & drop your legal document here, or click to browse</p>
              </div>
              <div className="flex justify-center gap-6">
                <Badge variant="outline" className="gap-2 py-2 px-4 text-sm">
                  <Camera size={18} />
                  Photo
                </Badge>
                <Badge variant="outline" className="gap-2 py-2 px-4 text-sm">
                  <FileText size={18} />
                  PDF, DOCX, TXT
                </Badge>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </Card>
        )}

        {selectedFile && !analysis && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <FileText size={32} className="text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                  <X size={20} />
                </Button>
              </div>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={analyzeDocument} 
              disabled={isAnalyzing}
              className="w-full h-12 text-base"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing Document...
                </>
              ) : (
                <>
                  <Eye size={20} className="mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => { setSelectedFile(null); setAnalysis(null); setCompliance(null); }}>
                ← Scan Another Document
              </Button>
              {/* Explicit trigger — only sends context to chatbot when user actively clicks */}
              <Button
                onClick={() => navigate('/chatbot')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <MessageCircle size={18} />
                Discuss this document with AI Lawyer
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Analysis Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Summary */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Summary</h3>
                  <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                </Card>

                {/* Key Details */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Key Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.keyDetails.map((detail, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        {getStatusIcon(detail.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{detail.label}</span>
                          </div>
                          <span className={`text-sm ${getStatusColor(detail.status)}`}>
                            {detail.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Legal Compliance */}
                {compliance && (
                  <Card className="p-6 border-l-4 border-l-indigo-600 shadow-md bg-indigo-50/30">
                    <h3 className="text-xl font-semibold mb-4 text-indigo-900">🏛️ Legal Compliance Check</h3>
                    <div className="prose prose-sm max-w-none mb-6 text-sm">
                      <div className="whitespace-pre-wrap">{formatText(compliance.compliance_report)}</div>
                    </div>
                    {compliance.cited_laws && compliance.cited_laws.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-2">Relevant Laws Checked</h4>
                        <div className="space-y-2">
                          {compliance.cited_laws.map((law: any, i: number) => (
                            <div key={i} className="text-sm p-3 bg-white border rounded">
                              <span className="font-semibold">{law.citation}</span>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{law.excerpt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Red Flags */}
                {analysis.redFlags.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <p className="font-semibold text-base text-red-800">⚠️ Red Flags Detected</p>
                        <ul className="space-y-2 text-red-700">
                          {analysis.redFlags.map((flag, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-sm">{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Suggestions */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">💡 Suggestions</h3>
                  <ul className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  {/* Document Type & Credibility */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Document Analysis</h3>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="outline" className="gap-1 mb-2">
                          <FileText size={14} />
                          {analysis.documentType}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-2">Credibility Score</span>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                analysis.credibilityScore >= 80 ? 'bg-green-500' :
                                analysis.credibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${analysis.credibilityScore}%` }}
                            />
                          </div>
                          <span className={`font-bold text-lg ${getCredibilityColor(analysis.credibilityScore)}`}>
                            {analysis.credibilityScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Privacy Notice */}
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Privacy Protection</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Your document is processed locally and securely. No personal data is stored on our servers.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}