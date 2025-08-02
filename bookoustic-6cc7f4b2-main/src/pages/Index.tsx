import { useState } from "react";
import { BookOpen, Sparkles, FileText, Wand2, Book, Eye, Edit3, RotateCcw, Heart, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [bookDescription, setBookDescription] = useState("");
  const [category, setCategory] = useState("");
  const [bookSize, setBookSize] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState("form"); // "form", "writing", "preview"
  const [isViewingBook, setIsViewingBook] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [writingProgress, setWritingProgress] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false); // For demo purposes
  const isMobile = useIsMobile();
  
  // Debug mobile detection
  console.log('Mobile detection:', isMobile, 'Window width:', typeof window !== 'undefined' ? window.innerWidth : 'SSR');

  const tabs = [
    { id: "create", label: "Create", icon: Wand2 },
    { id: "library", label: "Library", icon: FileText }
  ];

  const categories = [
    "Fiction", "Non-Fiction", "Fantasy", "Science Fiction", "Romance", 
    "Mystery", "Thriller", "Biography", "Self-Help", "Business"
  ];

  const bookSizes = [
    { id: "short", label: "Short Story", description: "5,000-8,000 words", wordCount: "~6K words" },
    { id: "medium", label: "Novella", description: "10,000-15,000 words", wordCount: "~12K words" },
    { id: "long", label: "Novel", description: "15,000-25,000 words", wordCount: "~20K words" }
  ];

  const handleGenerate = async () => {
    if (!bookDescription.trim() || !category) return;
    
    setIsGenerating(true);
    setCurrentView("writing");
    setWritingProgress(0);
    
    // Simulate writing animation
    for (let i = 0; i <= 100; i += 5) {
      setWritingProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Set generated content
    setGeneratedContent(`Chapter 1: The Beginning

The story begins in a world where ${bookDescription.slice(0, 100)}... 

[Generated content continues...]

This ${bookSizes.find(s => s.id === bookSize)?.label.toLowerCase()} explores themes of adventure, mystery, and discovery. The narrative unfolds across multiple chapters, each building upon the foundation established in your original description.

The characters face challenges that test their resolve, while the plot weaves together elements that create a compelling ${category} story.`);
    
    setCurrentView("preview");
    setIsGenerating(false);
  };

  const resetToForm = () => {
    setCurrentView("form");
    setIsViewingBook(false);
    setGeneratedContent("");
    setWritingProgress(0);
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Same animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-border/50 backdrop-blur-xl bg-background/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">Bookoustic</h1>
            </div>
            
            <Button
              onClick={() => setIsSignedIn(true)}
              className="bg-gradient-primary hover:bg-primary-dark shadow-elegant cursor-pointer transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2"
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-4 sm:px-8 py-8 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-16 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Book Creation Platform
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gradient leading-tight">
                Create Books with
                <br />
                <span className="text-primary">Artificial Intelligence</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your ideas into professional books in minutes. Our advanced AI analyzes your description 
                and crafts compelling narratives with rich characters, engaging plots, and polished prose.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => setIsSignedIn(true)}
                  className="px-8 py-4 text-lg bg-gradient-primary hover:bg-primary-dark shadow-elegant cursor-pointer transition-all duration-300"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Start Creating
                </Button>
                
                <Button variant="outline" className="px-8 py-4 text-lg border-border/50 hover:border-primary/50 cursor-pointer transition-all duration-300">
                  <Eye className="w-5 h-5 mr-2" />
                  View Examples
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl hover-lift animate-scale-in">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate complete books in minutes, not months. Our AI understands narrative structure and creates 
                  compelling stories at unprecedented speed.
                </p>
              </Card>

              <Card className="p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl hover-lift animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Professional Quality</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every book is crafted with attention to character development, plot coherence, and engaging prose 
                  that rivals traditionally published works.
                </p>
              </Card>

              <Card className="p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl hover-lift animate-scale-in" style={{ animationDelay: "0.2s" }}>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Multiple Genres</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From sci-fi epics to romance novels, our AI adapts to any genre and creates authentic, 
                  engaging content tailored to your vision.
                </p>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="p-12 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl text-center animate-fade-up">
              <h2 className="text-3xl font-bold text-gradient mb-4">Ready to Write Your Story?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of authors who have already transformed their ideas into published books with Bookoustic.
              </p>
              <Button
                onClick={() => setIsSignedIn(true)}
                className="px-10 py-4 text-lg bg-gradient-primary hover:bg-primary-dark shadow-elegant cursor-pointer transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Begin Your Journey
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Library-inspired animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        {/* Library shelves silhouette */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-primary/5 to-transparent opacity-30" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-foreground/5 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-border/50 backdrop-blur-xl bg-background/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">Bookoustic</h1>
            </div>
            
            <nav className="flex items-center gap-1 p-1 bg-card/50 backdrop-blur-xl rounded-xl border border-border/50">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ease-smooth animate-fade-in cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            {activeTab === "create" && (
              <div className="space-y-8">
                {currentView === "form" && (
                  <>
                    {/* Hero Section */}
                    <div className="text-center space-y-4 animate-fade-up">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Book Creation
                      </div>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient leading-tight">
                        Craft Your Story
                      </h2>
                      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Transform your ideas into compelling narratives. Describe your vision, 
                        choose your genre, and let AI help you create a professional book.
                      </p>
                    </div>

                    {/* Creation Form */}
                    <Card className="p-4 sm:p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl animate-scale-in hover-lift">
                      <div className="space-y-6 sm:space-y-8">
                        {/* Book Description */}
                        <div className="space-y-3">
                          <Label htmlFor="description" className="text-lg font-semibold text-foreground">
                            Describe Your Book
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the book you want to create. Be as detailed as possible about the plot, characters, setting, themes..."
                            value={bookDescription}
                            onChange={(e) => setBookDescription(e.target.value)}
                            className="min-h-32 bg-background/50 border-border/50 backdrop-blur-sm resize-none transition-all duration-300 focus:shadow-glow focus:border-primary/50"
                          />
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold text-foreground">
                            Select Category
                          </Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-background/50 border-border/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30">
                              <SelectValue placeholder="Choose a genre for your book" />
                            </SelectTrigger>
                            <SelectContent className="bg-card backdrop-blur-xl border-border/50">
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat.toLowerCase()}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Book Size */}
                        <div className="space-y-4">
                          <Label className="text-lg font-semibold text-foreground">
                            Book Length
                          </Label>
                          <RadioGroup value={bookSize} onValueChange={setBookSize} className="space-y-3">
                            {bookSizes.map((size) => (
                              <div
                                key={size.id}
                                className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer hover-lift hover:shadow-glow ${
                                  bookSize === size.id
                                    ? "border-primary bg-primary/5 shadow-glow"
                                    : "border-border/50 bg-background/30 hover:border-primary/30"
                                }`}
                              >
                                <RadioGroupItem value={size.id} id={size.id} className="text-primary" />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={size.id}
                                    className="text-base font-medium text-foreground cursor-pointer"
                                  >
                                    {size.label}
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    {size.description}
                                  </p>
                                </div>
                                <div className="text-sm font-medium text-primary">
                                  {size.wordCount}
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Generate Button */}
                        <Button
                          onClick={handleGenerate}
                          disabled={!bookDescription.trim() || !category || isGenerating}
                          className="w-full py-6 text-lg font-semibold bg-gradient-primary hover:bg-primary-dark transition-all duration-300 shadow-elegant hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isGenerating ? (
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Your Book...
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Wand2 className="w-5 h-5" />
                              Generate Book
                            </div>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </>
                )}

                {/* Writing Animation View */}
                {currentView === "writing" && (
                  <div className="text-center space-y-8 animate-fade-up">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow animate-pulse">
                        <Edit3 className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gradient">Writing Your Book</h2>
                      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Our AI is crafting your {bookSizes.find(s => s.id === bookSize)?.label.toLowerCase()} 
                        based on your description. This process creates compelling narratives with rich characters and engaging plots.
                      </p>
                    </div>
                    
                    {/* Progress Animation */}
                    <Card className="p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl max-w-2xl mx-auto">
                      <div className="space-y-6">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>{writingProgress}%</span>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary transition-all duration-300 ease-out rounded-full shadow-glow"
                            style={{ width: `${writingProgress}%` }}
                          />
                        </div>
                        
                        {/* Writing stages */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 33 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}>
                            <div className="text-sm font-medium">Plotting</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 66 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}>
                            <div className="text-sm font-medium">Writing</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 99 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}>
                            <div className="text-sm font-medium">Finalizing</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Book Preview */}
                {currentView === "preview" && (
                  <div className="space-y-8 animate-fade-up">
                    {/* Header with toggle */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gradient">Your Book is Ready!</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          {bookSizes.find(s => s.id === bookSize)?.label} • {category} • 
                          {bookSizes.find(s => s.id === bookSize)?.wordCount}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={resetToForm}
                        className="flex items-center gap-2 border-border/50 hover:border-primary/50 cursor-pointer transition-all duration-300 w-full sm:w-auto"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Create New
                      </Button>
                    </div>

                    {/* Book-like Preview - Responsive (1 page on mobile, 2 pages on desktop) */}
                    <Card className="p-4 sm:p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl hover-lift">
                      <div className="relative">
                        {/* Book-like Preview with responsive design */}
                        <div className="flex justify-center mb-6">
                          {/* Debug indicator */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs z-50">
                              Mobile: {isMobile ? 'Yes' : 'No'} ({typeof window !== 'undefined' ? window.innerWidth : 'SSR'}px)
                            </div>
                          )}
                          <div className={`relative flex shadow-2xl ${isMobile ? 'flex-col items-center' : ''}`}>
                            {/* Left page - A4 proportions (210 x 297mm ≈ 3:4.2 aspect ratio) */}
                            <div className={`bg-card border border-border/50 shadow-elegant relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow ${isMobile ? 'rounded-lg mb-4' : 'rounded-l-lg'}`} 
                                 style={{ width: isMobile ? '280px' : '320px', height: isMobile ? '400px' : '450px' }}>
                              <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />
                              <div className="relative p-6 h-full flex flex-col">
                                <div className="text-center mb-4 pb-3 border-b border-border/30">
                                  <h3 className="text-lg font-bold text-foreground mb-2">{bookDescription.slice(0, 50)}...</h3>
                                  <p className="text-sm text-muted-foreground uppercase tracking-wide">{category}</p>
                                </div>
                                <div className="flex-1 text-sm text-foreground leading-relaxed">
                                  {generatedContent.slice(0, isMobile ? 200 : 300)}...
                                </div>
                                <div className="text-center text-xs text-muted-foreground border-t border-border/30 pt-2 mt-3">
                                  — 1 —
                                </div>
                              </div>
                              {/* Page texture */}
                              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-transparent via-muted to-transparent pointer-events-none" />
                            </div>
                            
                            {/* Right page - Only show on desktop */}
                            {!isMobile && (
                              <>
                                <div className="bg-card border-l-0 border border-border/50 rounded-r-lg shadow-elegant relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow" style={{ width: '320px', height: '450px' }}>
                                  <div className="absolute inset-0 bg-gradient-to-bl from-background via-background to-background/95" />
                                  <div className="relative p-8 h-full flex flex-col">
                                    <div className="flex-1 text-sm text-foreground leading-relaxed">
                                      {generatedContent.slice(300, 600)}...
                                    </div>
                                    <div className="text-center text-xs text-muted-foreground border-t border-border/30 pt-3 mt-4">
                                      — 2 —
                                    </div>
                                  </div>
                                  {/* Page texture */}
                                  <div className="absolute inset-0 opacity-5 bg-gradient-to-bl from-transparent via-muted to-transparent pointer-events-none" />
                                </div>
                                
                                {/* Book binding shadow - Only on desktop */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-px w-2 h-full bg-gradient-to-b from-border/30 via-border/70 to-border/30 shadow-lg" />
                              </>
                            )}
                            
                            {/* Book depth effect */}
                            <div className={`absolute -bottom-2 -right-2 w-full h-full bg-border/20 ${isMobile ? 'rounded-lg' : 'rounded-r-lg'} -z-10`} />
                            <div className={`absolute -bottom-1 -right-1 w-full h-full bg-border/10 ${isMobile ? 'rounded-lg' : 'rounded-r-lg'} -z-20`} />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Button
                        variant="outline"
                        className="px-6 py-3 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer transition-all duration-300 w-full sm:w-auto"
                        onClick={() => {/* Add to Library functionality will be implemented */}}
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Add to Library
                      </Button>
                      
                      <Button
                        className="px-8 py-3 bg-gradient-primary hover:bg-primary-dark shadow-elegant text-lg font-semibold cursor-pointer transition-all duration-300 w-full sm:w-auto"
                        onClick={() => {/* Download functionality will be implemented */}}
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Download as PDF
                      </Button>
                    </div>

                    {/* Content Overview */}
                    <Card className="p-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-xl">
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground">Content Overview</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-primary mb-1">
                              {bookSizes.find(s => s.id === bookSize)?.wordCount}
                            </div>
                            <div className="text-sm text-muted-foreground">Word Count</div>
                          </div>
                          
                          <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-primary mb-1">{category}</div>
                            <div className="text-sm text-muted-foreground">Genre</div>
                          </div>
                          
                          <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-primary mb-1">
                              {bookSizes.find(s => s.id === bookSize)?.label}
                            </div>
                            <div className="text-sm text-muted-foreground">Book Type</div>
                          </div>
                        </div>
                        
                        <div className="bg-background/30 rounded-lg p-6 border border-border/30">
                          <h4 className="font-medium text-foreground mb-3">Generated Content Preview</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                            {generatedContent}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Library Tab */}
            {activeTab === "library" && (
              <div className="text-center py-20 animate-fade-up">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Your Library</h3>
                <p className="text-muted-foreground">Your created books will appear here</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;