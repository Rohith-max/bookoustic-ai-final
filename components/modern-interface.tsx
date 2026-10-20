"use client"

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, FileText, Wand2, Book, Download, ClipboardList, Trash2, Feather, Library, PenTool } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from '@clerk/nextjs';
import { generateBook } from "@/app/actions/generate-book";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSupabaseClient } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VintageButton } from "@/components/ui/vintage-button";
import { TexturedCard } from "@/components/ui/textured-card";
import { BookSpine } from "@/components/ui/book-spine";
import { Button } from "@/components/ui/button";

const BookReader = dynamic(() => import("@/components/book-reader").then(mod => ({ default: mod.BookReader })), {
  loading: () => <div className="text-center py-12 text-leather">Loading book preview...</div>,
  ssr: false,
});

export default function ModernInterface() {
  const [activeTab, setActiveTab] = useState("create");
  const [bookDescription, setBookDescription] = useState("");
  const [authorTone, setAuthorTone] = useState("");
  const [category, setCategory] = useState("");
  const [bookSize, setBookSize] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState("form");
  const [writingProgress, setWritingProgress] = useState(0);
  const [bookContent, setBookContent] = useState<any | null>(null);
  const [pageContent, setPageContent] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<any[] | null>(null);
  const [libraryTimer, setLibraryTimer] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();

  const tabs = [
    { id: "create", label: "Write", icon: PenTool },
    { id: "library", label: "Library", icon: Library }
  ];

  const categories = [
    "Fiction", "Non-Fiction", "Fantasy", "Science Fiction", "Romance", 
    "Mystery", "Thriller", "Biography", "Self-Help", "Business",
    "Historical Fiction", "Horror", "Adventure", "Memoir", "Poetry"
  ];

  const bookSizes = [
    { id: "short", label: "Short Story", description: "5,000-8,000 words", wordCount: "~6K words" },
    { id: "medium", label: "Novella", description: "10,000-15,000 words", wordCount: "~12K words" },
    { id: "long", label: "Novel", description: "15,000-25,000 words", wordCount: "~20K words" }
  ];

  // Load library books when library tab is active
  useEffect(() => {
    if (activeTab === "library" && user) {
      loadLibraryBooks();
    }
  }, [activeTab, user]);

  const loadLibraryBooks = async () => {
    if (!user) return;
    
    try {
      const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) ||
                    (await getToken().catch(() => undefined)) ||
                    undefined;
      
      if (!token) {
        console.error("Failed to get authentication token");
        setLibraryBooks([]);
        return;
      }

      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("book_generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading library:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your library.",
        });
        setLibraryBooks([]);
      } else {
        setLibraryBooks(data || []);
      }
    } catch (err) {
      console.error("Error loading library:", err);
      setLibraryBooks([]);
    }
  };

  const loadBookFromLibrary = (book: any) => {
    if (book.book_data) {
      setBookContent(book.book_data);
      setCategory(book.book_data.category || "Fiction");
      setCurrentView("preview");
      setActiveTab("create");
    }
  };

  const handleGenerate = async () => {
    if (!bookDescription.trim() || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a book description and select a genre.",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentView("writing");
    setWritingProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setWritingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      console.log('Starting book generation with params:', {
        description: bookDescription,
        category,
        size: bookSize,
        tone: authorTone || "engaging and descriptive"
      });

      const result = await generateBook(
        bookDescription,
        category,
        bookSize,
        authorTone || "engaging and descriptive"
      );

      console.log('Book generation result:', result);

      clearInterval(progressInterval);
      setWritingProgress(100);

      if (result.success && result.book) {
        setBookContent(result.book);
        setTimeout(() => {
          setCurrentView("preview");
          setIsGenerating(false);
        }, 500);

        toast({
          title: "Book Generated!",
          description: "Your book is ready to read.",
        });
      } else {
        const errorMessage = result.error || "Failed to generate book";
        console.error('Generation failed with error:', errorMessage);
        console.error('Full result object:', result);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error generating book:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      
      clearInterval(progressInterval);
      setIsGenerating(false);
      setCurrentView("form");
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate book. Please check the console for details.",
      });
    }
  };

  const resetToForm = () => {
    setCurrentView("form");
    setBookContent(null);
    setWritingProgress(0);
    setBookDescription("");
    setAuthorTone("");
    setCategory("");
    setBookSize("medium");
  };

  // Landing Page with Vintage Theme
  const LandingPage = ({ animationsPlayed }: { animationsPlayed: boolean }) => {
    return (
      <div className="min-h-screen bg-sepia text-ink font-merriweather relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 border-t-4 border-l-4 border-gold/20 rounded-tl-3xl m-8 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 border-b-4 border-r-4 border-gold/20 rounded-br-3xl m-8 pointer-events-none" />

        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full bg-cream/95 backdrop-blur-sm border-b border-gold/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="font-playfair text-2xl font-bold text-leather tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-gold" />
                Bookoustic
              </Link>
              <div className="flex items-center gap-2">
                <SignInButton>
                  <VintageButton variant="secondary" className="px-4 py-2 text-sm">Sign In</VintageButton>
                </SignInButton>
                <SignUpButton>
                  <VintageButton className="px-4 py-2 text-sm">Sign Up</VintageButton>
                </SignUpButton>
              </div>
            </div>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-4xl mx-auto text-center px-4 py-16">
          <div>
            <h2 className="text-gold font-merriweather text-lg tracking-[0.2em] uppercase mb-4">
              Est. 2024
            </h2>
            <h1 className="font-playfair text-6xl md:text-8xl font-bold text-ink mb-6 drop-shadow-sm">
              Bookoustic
            </h1>
            <p className="font-merriweather text-xl md:text-2xl text-leather/80 italic max-w-2xl mx-auto leading-relaxed">
              &ldquo;Where stories are crafted with ink, paper, and a touch of magic.&rdquo;
            </p>
          </div>

          {/* Vintage Divider */}
          <div className="flex items-center justify-center gap-4 my-12">
            <div className="h-[1px] w-24 bg-leather/30" />
            <div className="w-3 h-3 rotate-45 border border-gold bg-sepia" />
            <div className="h-[1px] w-24 bg-leather/30" />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <SignUpButton>
              <VintageButton>
                <BookOpen className="w-5 h-5" />
                Start Writing
              </VintageButton>
            </SignUpButton>
          </div>
        </main>
      </div>
    );
  };

  // Show landing page if not signed in
  if (!user) {
    return <LandingPage animationsPlayed={false} />;
  }

  // Signed-in Interface
  return (
    <div className="h-screen bg-[#F4E8D8] text-ink font-merriweather flex flex-col">
      {/* Navigation Header */}
      <nav className="flex-shrink-0 z-50 w-full bg-cream border-b border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-playfair text-2xl font-bold text-leather tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gold" />
              Bookoustic
            </Link>

            <div className="hidden sm:flex sm:space-x-8" style={{ marginRight: '118px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id ? 'text-leather' : 'text-ink/60 hover:text-leather'
                  }`}
                >
                  <span className="flex items-center gap-2 font-merriweather">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                  )}
                </button>
              ))}
            </div>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeTab === "create" && currentView === "form" && (
          <div className="min-h-full bg-[#5C4033]">
            <div className="flex items-center justify-center p-4 md:p-12 py-12">
              <TexturedCard variant="paper" withTornEdge className="max-w-2xl w-full my-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sepia border border-gold mb-4">
                    <Feather className="w-6 h-6 text-leather" />
                  </div>
                  <h2 className="font-playfair text-4xl font-bold text-ink mb-2">
                    The Writer&apos;s Desk
                  </h2>
                  <p className="font-merriweather text-leather/70 italic">
                    Compose your next masterpiece...
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Book Description */}
                  <div className="space-y-2">
                    <label className="block font-playfair text-lg text-ink font-bold">
                      Story Vision
                    </label>
                    <textarea
                      placeholder="Describe the book you want to create..."
                      value={bookDescription}
                      onChange={(e) => setBookDescription(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-leather/20 focus:border-gold px-2 py-3 font-merriweather text-lg text-ink placeholder:text-leather/30 focus:outline-none resize-none min-h-[100px]"
                    />
                  </div>

                  {/* Author Tone */}
                  <div className="space-y-2">
                    <label className="block font-playfair text-lg text-ink font-bold">
                      Writing Style
                    </label>
                    <textarea
                      placeholder="Describe the author's writing style and tone..."
                      value={authorTone}
                      onChange={(e) => setAuthorTone(e.target.value)}
                      className="w-full bg-sepia/30 rounded-md border border-leather/10 focus:border-gold px-4 py-3 font-merriweather text-ink placeholder:text-leather/30 focus:outline-none resize-none min-h-[80px]"
                    />
                  </div>

                  {/* Genre Selection */}
                  <div className="space-y-2">
                    <label className="block font-playfair text-lg text-ink font-bold">
                      Genre
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-sepia/30 border-2 border-leather/20 focus:border-gold rounded-md px-4 py-3 font-merriweather text-base text-ink focus:outline-none cursor-pointer hover:border-gold/50 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235D4037' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '3rem',
                        position: 'relative',
                        verticalAlign: 'bottom'
                      }}
                      aria-label="Genre"
                    >
                      <option value="" className="bg-cream text-ink">Choose a genre</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat.toLowerCase()} className="bg-cream text-ink py-2">{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Book Size */}
                  <div className="space-y-4">
                    <label className="block font-playfair text-lg text-ink font-bold">
                      Book Length
                    </label>
                    <RadioGroup value={bookSize} onValueChange={setBookSize} className="space-y-3">
                      {bookSizes.map((size) => (
                        <div
                          key={size.id}
                          className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer ${
                            bookSize === size.id
                              ? "border-gold bg-sepia/50"
                              : "border-leather/20 bg-cream/50 hover:border-gold/50"
                          }`}
                        >
                          <RadioGroupItem value={size.id} id={size.id} className="text-gold" />
                          <div className="flex-1">
                            <Label htmlFor={size.id} className="font-playfair text-base font-medium text-ink cursor-pointer">
                              {size.label}
                            </Label>
                            <p className="text-sm text-leather/60">{size.description}</p>
                          </div>
                          <div className="text-sm font-medium text-gold">{size.wordCount}</div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4 flex justify-center">
                    <VintageButton
                      onClick={handleGenerate}
                      disabled={!bookDescription.trim() || !category || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-5 h-5 animate-spin" />
                          Inking Pages...
                        </>
                      ) : (
                        <>
                          <Feather className="w-5 h-5" />
                          Generate Story
                        </>
                      )}
                    </VintageButton>
                  </div>
                </div>
              </TexturedCard>
            </div>
          </div>
        )}

        {/* Writing Progress View */}
        {activeTab === "create" && currentView === "writing" && (
          <div className="min-h-full bg-[#5C4033] flex items-center justify-center p-8">
            <TexturedCard className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-leather rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Feather className="w-10 h-10 text-cream" />
              </div>
              <h2 className="font-playfair text-3xl font-bold text-ink mb-4">Crafting Your Tale</h2>
              <p className="text-leather/70 mb-8">The quill moves across parchment...</p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-leather/60 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(writingProgress)}%</span>
                </div>
                <div className="w-full bg-sepia rounded-full h-3 overflow-hidden border border-gold/30">
                  <div 
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${writingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-leather/70 bg-gold/10 border border-gold/30 rounded-md px-4 py-3">
                  Please note: this software uses a rate-limited API, so generations can take a while. A local model setup is currently under development.
                </p>
              </div>
            </TexturedCard>
          </div>
        )}

        {/* Preview View */}
        {activeTab === "create" && currentView === "preview" && bookContent && (
          <div className="bg-[#F4E8D8] px-4 md:px-12 py-12">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <VintageButton variant="secondary" onClick={resetToForm}>
                  Create New Book
                </VintageButton>
              </div>
              <BookReader 
                book={bookContent} 
                isLoading={false} 
                category={category} 
                setPageContent={setPageContent} 
                onClose={resetToForm}
                libraryTimer={libraryTimer}
              />
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          <div className="min-h-full bg-[#5C4033]">
            <div className="px-4 py-12">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="font-playfair text-5xl font-bold text-cream mb-4 drop-shadow-md">
                    Your Library
                  </h1>
                  <div className="h-1 w-24 bg-gold mx-auto rounded-full" />
                </div>

                {libraryBooks === null ? (
                  <div className="flex flex-col items-center justify-center py-16 text-cream">
                    <span className="mb-4 font-merriweather">Loading your collection...</span>
                    <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
                  </div>
                ) : libraryBooks.length === 0 ? (
                  <div className="flex justify-center">
                    <TexturedCard className="max-w-md text-center">
                      <div className="w-16 h-16 bg-leather rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-cream" />
                      </div>
                      <h3 className="font-playfair text-xl font-bold text-ink mb-3">Your Library is Empty</h3>
                      <p className="text-leather/70 mb-6">
                        Create and save books to build your personal collection.
                      </p>
                      <VintageButton onClick={() => setActiveTab("create")}>
                        <Feather className="w-4 h-4" />
                        Write a Book
                      </VintageButton>
                    </TexturedCard>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                    {libraryBooks.map((book: any) => {
                      const coverImageUrl = book.cover_image_url;
                      const coverPage = book.book_data?.cover_page || 
                                       book.book_data?.coverPage || 
                                       book.book_data?.pages?.[0];
                      
                      return (
                        <TexturedCard key={book.id} className="p-6">
                          <div className="flex items-start gap-5 mb-6">
                            {coverImageUrl ? (
                              <div 
                                className="flex-shrink-0 w-32 h-40 rounded-md bg-cover bg-center relative overflow-hidden"
                                style={{ 
                                  backgroundImage: `url(${coverImageUrl})`,
                                }}
                              />
                            ) : coverPage ? (
                              <div 
                                className="flex-shrink-0 w-32 h-40 rounded-md overflow-hidden relative"
                                style={{
                                  backgroundImage: coverPage.backgroundImage || 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                              >
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                                  <h3 
                                    className="font-playfair text-sm font-bold mb-1"
                                    style={{ color: coverPage.titleColor || '#F4E8D8' }}
                                  >
                                    {coverPage.title || book.book_title || book.book_data?.title || "Untitled"}
                                  </h3>
                                  {(coverPage.author || book.book_data?.author) && (
                                    <p 
                                      className="font-merriweather text-[10px] mt-auto"
                                      style={{ color: coverPage.authorColor || '#F4E8D8' }}
                                    >
                                      {coverPage.author || book.book_data?.author}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-32 h-40 bg-leather rounded-md flex items-center justify-center">
                                <Book className="w-16 h-16 text-cream" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-playfair text-2xl font-bold text-ink mb-2 truncate">
                                {book.book_title || book.book_data?.title || "Untitled"}
                              </h3>
                              <p className="text-base text-leather/70 mb-2">
                                by {book.book_data?.author || "Unknown Author"}
                              </p>
                              <p className="text-sm text-leather/60">
                                {new Date(book.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <VintageButton
                              onClick={() => loadBookFromLibrary(book)}
                              className="flex-1"
                            >
                              <BookOpen className="w-4 h-4" />
                              Read
                            </VintageButton>
                            <VintageButton
                              variant="secondary"
                              onClick={() => {
                                setBookToDelete(book);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </VintageButton>
                          </div>
                        </TexturedCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-cream border-2 border-gold/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl text-ink">Delete Book</DialogTitle>
            <DialogDescription className="font-merriweather text-leather/70">
              Are you sure you want to delete &quot;{bookToDelete?.book_title || bookToDelete?.book_data?.title || 'this book'}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <VintageButton
              variant="secondary"
              onClick={() => {
                setShowDeleteDialog(false);
                setBookToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </VintageButton>
            <VintageButton
              onClick={async () => {
                if (!bookToDelete) return;
                
                setIsDeleting(true);
                try {
                  const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) ||
                                (await getToken().catch(() => undefined)) ||
                                undefined;
                  
                  if (!token) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Authentication failed",
                    });
                    return;
                  }

                  const supabase = getSupabaseClient(token);
                  const { error } = await supabase
                    .from("book_generations")
                    .delete()
                    .eq("id", bookToDelete.id);

                  if (error) throw error;

                  toast({
                    title: "Success",
                    description: "Book deleted successfully",
                  });
                  
                  loadLibraryBooks();
                } catch (error) {
                  console.error("Error deleting book:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to delete book",
                  });
                } finally {
                  setIsDeleting(false);
                  setShowDeleteDialog(false);
                  setBookToDelete(null);
                }
              }}
              disabled={isDeleting}
              className="flex-1 bg-red-700 hover:bg-red-800 border-red-800"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </VintageButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}