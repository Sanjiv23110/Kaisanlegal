import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { Search, Plus, User, MessageSquare, ArrowLeft, Calendar, Shield, CheckCircle, AlertTriangle } from "lucide-react";

interface Post {
  id: string;
  username: string;
  title: string;
  content: string;
  replies: number;
  lastReply: string;
  timestamp: string;
}

interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}

interface VerificationResult {
  type: 'verified' | 'unverifiable' | 'experience';
  message: string;
}

export function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [newComment, setNewComment] = useState("");
  const [verificationResults, setVerificationResults] = useState<{[key: string]: VerificationResult}>({});

  // Mock data for posts
  const mockPosts: Post[] = [
    {
      id: "1",
      username: "LegalUser#1234",
      title: "Help with rejected GST application",
      content: "My GST registration was rejected due to incomplete documents. What should I do next?",
      replies: 5,
      lastReply: "2 hours ago",
      timestamp: "2025-01-15"
    },
    {
      id: "2", 
      username: "LegalUser#5678",
      title: "Property dispute with neighbor over boundary",
      content: "My neighbor claims part of my land belongs to them. I have all the property documents. How do I resolve this?",
      replies: 12,
      lastReply: "5 hours ago",
      timestamp: "2025-01-14"
    },
    {
      id: "3",
      username: "LegalUser#9876",
      title: "Employment termination without notice period",
      content: "Company terminated me immediately without serving notice period. Can I claim compensation?",
      replies: 8,
      lastReply: "1 day ago",
      timestamp: "2025-01-13"
    }
  ];

  // Mock data for comments
  const mockComments: Comment[] = [
    {
      id: "c1",
      username: "LegalUser#2468",
      content: "You need to resubmit with proper documentation. Make sure you have your PAN card, address proof, and bank statements ready. The fee is ₹500 for reapplication.",
      timestamp: "2 hours ago"
    },
    {
      id: "c2",
      username: "LegalUser#1357",
      content: "I faced the same issue last year. Visit the GST office directly with all documents. They are more helpful in person than online.",
      timestamp: "4 hours ago"
    }
  ];

  const filteredPosts = mockPosts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerifyWithAI = (commentId: string, content: string) => {
    // Simulate AI verification logic
    let result: VerificationResult;
    
    if (content.includes("₹500") || content.includes("PAN card") || content.includes("bank statements")) {
      result = {
        type: 'verified',
        message: "The statement about required documents and fees for GST registration is accurate and matches current government guidelines."
      };
    } else if (content.includes("visit the GST office")) {
      result = {
        type: 'experience',
        message: "This comment is a personal anecdote about a user's experience and contains no verifiable legal information."
      };
    } else {
      result = {
        type: 'unverifiable',
        message: "The statement could not be verified from official government sources. Please exercise caution."
      };
    }
    
    setVerificationResults(prev => ({ ...prev, [commentId]: result }));
  };

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unverifiable':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'experience':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-3">Community</h1>
            <p className="text-lg text-indigo-100">Connect with others, share experiences, and get insights from the community</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        {!selectedPost ? (
          <>
            {/* Search and Actions Bar */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base"
                    />
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-12 text-base w-full">
                      <Plus size={20} className="mr-2" />
                      Ask a Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ask a Question</DialogTitle>
                      <DialogDescription>
                        Share your legal question with the community. Please provide as much detail as possible.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Question title"
                        value={newQuestion.title}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Describe your legal question in detail..."
                        value={newQuestion.content}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                      />
                      <Button className="w-full">Post Question</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Disclaimer */}
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Disclaimer:</strong> User-generated content. Not a substitute for professional legal advice.
                </AlertDescription>
              </Alert>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-primary/30"
                  onClick={() => setSelectedPost(post)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{post.username}</span>
                      <Badge variant="outline" className="text-xs ml-auto">User Contribution</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-3 leading-snug">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        <span>{post.replies} replies</span>
                      </div>
                      <span>Last: {post.lastReply}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          // Post Detail View
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPost(null)}
              className="mb-6"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Feed
            </Button>
            
            {/* Original Post */}
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedPost.username}</span>
                  <Badge variant="outline" className="text-xs ml-auto">User Contribution</Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{selectedPost.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{selectedPost.timestamp}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="leading-relaxed">{selectedPost.content}</p>
              </CardContent>
            </Card>
            
            {/* Replies Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Replies ({mockComments.length})</h3>
              
              {mockComments.map((comment) => (
                <Card key={comment.id} className="bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{comment.username}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    
                    <p className="leading-relaxed mb-4">{comment.content}</p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyWithAI(comment.id, comment.content)}
                    >
                      <Shield size={14} className="mr-2" />
                      Verify with AI
                    </Button>
                    
                    {verificationResults[comment.id] && (
                      <div className="mt-4 p-4 bg-background rounded-lg border">
                        <div className="flex items-start gap-3">
                          {getVerificationIcon(verificationResults[comment.id].type)}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {verificationResults[comment.id].message}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {/* Reply Input */}
              <Card>
                <CardContent className="p-6">
                  <Textarea
                    placeholder="Write your reply..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="mb-4"
                  />
                  <Button className="w-full md:w-auto">Post Reply</Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Bottom Disclaimer */}
            <Alert className="mt-8 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                Remember to consult with a professional for specific legal advice.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}