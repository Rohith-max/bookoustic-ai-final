"use client"

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, FileText, Wand2, Book, Download, History, ClipboardList, Trash2, Target, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
// Import Clerk components conditionally
import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from '@clerk/nextjs';
import { generateBook } from "@/app/actions/generate-book";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSupabaseClient } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Replace the Clerk hooks with safe versions
const useSafeUser = () => {
  try {
    return useUser();
  } catch (error) {
    return { isSignedIn: false, user: null };
  }
};

const useSafeAuth = () => {
  try {
    return useAuth();
  } catch (error) {
    return { 
      getToken: async () => null 
    };
  }
};

const BookReader = dynamic(() => import("@/components/book-reader").then(mod => ({ default: mod.BookReader })), {
  loading: () => <div className="text-center py-12">Loading book preview...</div>,
  ssr: false,
});

// Accent color constants
const ACCENT_COLOR = "#8b5cf6"; // purple-500
const ACCENT_COLOR_HOVER = "#7c3aed"; // purple-600
const ACCENT_TEXT_COLOR = "#fff";
const ACCENT_TEXT_COLOR_HOVER = "#fff";
const ACCENT_OUTLINE = `1px solid ${ACCENT_COLOR}`;

// Helper for accent button props
const accentButtonProps = {
  style: {
    backgroundColor: ACCENT_COLOR,
    color: ACCENT_TEXT_COLOR,
    border: ACCENT_OUTLINE,
    transition: 'all 0.2s',
  },
  onMouseOver: (e: any) => {
    e.currentTarget.style.backgroundColor = ACCENT_COLOR_HOVER;
    e.currentTarget.style.color = ACCENT_TEXT_COLOR_HOVER;
  },
  onMouseOut: (e: any) => {
    e.currentTarget.style.backgroundColor = ACCENT_COLOR;
    e.currentTarget.style.color = ACCENT_TEXT_COLOR;
  },
};
const accentOutlineButtonProps = {
  style: {
    backgroundColor: '#fff',
    color: ACCENT_COLOR,
    border: ACCENT_OUTLINE,
    transition: 'all 0.2s',
  },
  onMouseOver: (e: any) => {
    e.currentTarget.style.backgroundColor = ACCENT_COLOR_HOVER;
    e.currentTarget.style.color = ACCENT_TEXT_COLOR_HOVER;
  },
  onMouseOut: (e: any) => {
    e.currentTarget.style.backgroundColor = '#fff';
    e.currentTarget.style.color = ACCENT_COLOR;
  },
};

export default function ModernInterface() {
  const [activeTab, setActiveTab] = useState("create");
  const [bookDescription, setBookDescription] = useState("");
  const [authorTone, setAuthorTone] = useState("");
  const [category, setCategory] = useState("");
  const [bookSize, setBookSize] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState("form"); // "form", "writing", "preview"
  const [writingProgress, setWritingProgress] = useState(0);
  const [bookContent, setBookContent] = useState<any | null>(null);
  const [pageContent, setPageContent] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { isSignedIn, user } = useSafeUser();
  const { getToken } = useSafeAuth();

  // 1. Add state for delete confirmation
  const [bookToDelete, setBookToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // 1. Add state for add-to-library confirmation
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  // Update the tabs array to remove History
  const tabs = [
    { id: "create", label: "Create", icon: Wand2 },
    { id: "library", label: "Library", icon: FileText },
    { id: "features", label: "Features", icon: Sparkles }
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

  // Add state for library books
  const [libraryBooks, setLibraryBooks] = useState<any[] | null>(null);

  // Loader animation state
  const [showLandingLoader, setShowLandingLoader] = useState(true);
  const [animationsPlayed, setAnimationsPlayed] = useState(false);
  
  useEffect(() => {
    if (!isSignedIn) {
      setShowLandingLoader(true);
      const timer = setTimeout(() => {
        setShowLandingLoader(false);
        setAnimationsPlayed(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setAnimationsPlayed(true);
    }
  }, [isSignedIn]);

  // Load book content from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBook = localStorage.getItem("bookoustic_book_content")
      if (savedBook) {
        setBookContent(JSON.parse(savedBook))
        setCurrentView("preview")
      }
    }
  }, []);

  // Save book content to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && bookContent) {
      localStorage.setItem("bookoustic_book_content", JSON.stringify(bookContent))
    }
  }, [bookContent]);

  // Add a function to load library books
  const loadLibraryBooks = async () => {
    setLibraryBooks(null);
    // First try to load from Supabase if user is signed in
    if (user) {
      try {
        const token = await getToken({ template: 'supabase' })
          .catch(() => getToken())
          .catch(() => null);
          
        if (token) {
          const supabase = getSupabaseClient(token);
          
          const { data, error } = await supabase
            .from('book_generations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (!error && data) {
            setLibraryBooks(data);
            return;
          }
        }
      } catch (err) {
        console.error("Error loading books from Supabase:", err);
      }
    }
    
    // Fallback to localStorage
    try {
      if (typeof window !== "undefined") {
        const savedBooks = JSON.parse(localStorage.getItem("bookoustic_saved_books") || "[]");
        setLibraryBooks(savedBooks);
      }
    } catch (err) {
      console.error("Error loading books from localStorage:", err);
      setLibraryBooks([]);
    }
  };

  // Add useEffect to load library books when the tab changes
  useEffect(() => {
    if (activeTab === "library") {
      loadLibraryBooks();
    }
  }, [activeTab, user]);

  // Add function to load a book from the library
  const loadBookFromLibrary = (book: any) => {
    setBookContent(book.book_data);
    setCurrentView("preview");
    setActiveTab("create");
  };

  // Add function to delete a book from the library
  const deleteBookFromLibrary = async (bookId: string, isLocalBook: boolean = false) => {
    if (!isLocalBook && user) {
      try {
        const token = await getToken({ template: 'supabase' })
          .catch(() => getToken())
          .catch(() => null);
          
        if (token) {
          const supabase = getSupabaseClient(token);
          
          const { error } = await supabase
            .from('book_generations')
            .delete()
            .eq('id', bookId);
            
          if (!error) {
            toast({
              title: "Book Deleted",
              description: "The book has been removed from your library.",
            });
            
            // Reload library books
            loadLibraryBooks();
            return;
          } else {
            throw new Error(error.message);
          }
        }
      } catch (err: any) {
        console.error("Error deleting book from Supabase:", err);
        toast({
          title: "Delete Error",
          description: `Could not delete book: ${err.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } else {
      // Delete from localStorage
      try {
        if (typeof window !== "undefined") {
          const savedBooks = JSON.parse(localStorage.getItem("bookoustic_saved_books") || "[]");
          const updatedBooks = savedBooks.filter((book: any) => book.id !== bookId);
          localStorage.setItem("bookoustic_saved_books", JSON.stringify(updatedBooks));
          
          toast({
            title: "Book Deleted",
            description: "The book has been removed from your library.",
          });
          
          // Update state
          setLibraryBooks(updatedBooks);
        }
      } catch (err) {
        console.error("Error deleting book from localStorage:", err);
        toast({
          title: "Delete Error",
          description: "Could not delete book from local storage.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!bookDescription.trim() || !category) return;
    
    setIsGenerating(true);
    setCurrentView("writing");
    setWritingProgress(0);
    
    // Simulate progress bar while generating
    const progressInterval = setInterval(() => {
      setWritingProgress(prev => {
        if (prev >= 90) {
          return 90;
        }
        return prev + Math.random() * 6 + 2;
      });
    }, 400);
    
    try {
      const content = await generateBook(bookDescription, category.toLowerCase(), bookSize, authorTone);
      
      clearInterval(progressInterval);
      setWritingProgress(100);
      setBookContent(content);
      setCurrentView("preview");
      
      toast({
        title: "Book Generated",
        description: "Your book has been successfully created!",
      });
    } catch (error: any) {
      console.error("Error generating book:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "An error occurred while generating your book.",
        variant: "destructive",
      });
      setCurrentView("form");
    } finally {
      setIsGenerating(false);
      clearInterval(progressInterval);
    }
  };

  const handleDownloadPDF = async () => {
    if (!bookContent) return;

    setIsDownloading(true);
    try {
      toast({
        title: "Preparing PDF",
        description: "Generating PDF of the complete book. This may take a moment...",
      });
      
      // Use the paginated pageContent for WYSIWYG export
      const pdfDataUri = await generatePDF(bookContent, category, undefined, pageContent);
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = `${bookContent.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF Downloaded",
        description: "Your complete book has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: `Failed to download the book as PDF: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const saveBookToLibrary = async () => {
    if (!bookContent) {
      toast({
        title: "No book to save",
        description: "Please generate a book first.",
        variant: "destructive",
      });
      return;
    }

    let coverImageUrl = null;
    // Try to extract cover image from DOM
    try {
      if (typeof window !== "undefined") {
        const coverElement = document.querySelector('.book-cover-capture');
        if (coverElement) {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(coverElement as HTMLElement, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
          });
          coverImageUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }
    } catch (err) {
      console.error("Error capturing cover image:", err);
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save books to your library.",
        variant: "destructive",
      });
      // Save to localStorage as fallback
      try {
        if (typeof window !== "undefined") {
          const savedBooks = JSON.parse(localStorage.getItem("bookoustic_saved_books") || "[]");
          savedBooks.push({
            id: Date.now().toString(),
            book_title: bookContent.title || "Untitled Book",
            book_data: bookContent,
            cover_image_url: coverImageUrl,
            created_at: new Date().toISOString()
          });
          localStorage.setItem("bookoustic_saved_books", JSON.stringify(savedBooks));
          toast({
            title: "Book Saved Locally",
            description: "Your book has been saved to your browser storage.",
          });
          // Reload library books if on library tab
          if (activeTab === "library") {
            loadLibraryBooks();
          }
        }
      } catch (err) {
        console.error("Error saving book to localStorage:", err);
      }
      return;
    }

    try {
      // Get auth token
      const token = await getToken({ template: 'supabase' })
        .catch(() => getToken())
        .catch(() => null);
      if (!token) {
        throw new Error("Failed to get authentication token for Supabase");
      }
      // Initialize Supabase client with token
      const supabase = getSupabaseClient(token);
      // Make sure book data is properly formatted
      const bookToSave = {
        user_id: user.id,
        book_title: bookContent.title || "Untitled Book",
        book_data: bookContent,
        cover_image_url: coverImageUrl,
        created_at: new Date().toISOString()
      };
      // Insert the book into Supabase
      const { error } = await supabase
        .from('book_generations')
        .insert([bookToSave]);
      if (error) {
        // Check for duplicate/unique constraint error
        const duplicate = error.code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate'));
        toast({
          title: duplicate ? "Book already exists in library" : "Save Error",
          description: duplicate ? undefined : `Could not save to library: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Book Saved",
        description: "Your book has been saved to your library.",
      });
      // Reload library books if on library tab
      if (activeTab === "library") {
        loadLibraryBooks();
      }
    } catch (err: any) {
      console.error("Error saving book to Supabase:", err);
      toast({
        title: "Save Error",
        description: `Could not save to library: ${err.message || "Unknown error"}`,
        variant: "destructive",
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("bookoustic_book_content");
    }
  };

  const LandingPage = ({ onLandingReady, animationsPlayed }: { onLandingReady?: () => void, animationsPlayed: boolean }) => {
    useEffect(() => {
      if (onLandingReady) onLandingReady();
    }, []);

    const renderAuthButtons = () => {
      try {
        return (
          <div className="flex items-center gap-2">
            <SignInButton>
              <Button variant="outline" className="px-4 py-2 sm:px-6 text-sm sm:text-base">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button className="px-4 py-2 sm:px-6 text-sm sm:text-base">Sign Up</Button>
            </SignUpButton>
          </div>
        );
      } catch (error) {
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="px-4 py-2 sm:px-6 text-sm sm:text-base">Sign In</Button>
            <Button className="px-4 py-2 sm:px-6 text-sm sm:text-base">Sign Up</Button>
          </div>
        );
      }
    };

    const renderHeroButton = () => {
      try {
        return (
          <SignUpButton>
            <Button className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <Wand2 className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
          </SignUpButton>
        );
      } catch (error) {
        return (
          <Button className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Wand2 className="w-5 h-5 mr-2" />
            Start Creating
          </Button>
        );
      }
    };

    const renderCTAButton = () => {
      try {
        return (
          <SignUpButton>
            <Button className="w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <Sparkles className="w-5 h-5 mr-2" />
              Begin Your Journey
            </Button>
          </SignUpButton>
        );
      } catch (error) {
        return (
          <Button className="w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Sparkles className="w-5 h-5 mr-2" />
            Begin Your Journey
          </Button>
        );
      }
    };

    return (
      <div className="min-h-screen bg-[#f6f8fc] relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 ${animationsPlayed ? 'animate-fade-in' : ''}`} style={{ animationDelay: '0.1s' }} />
          <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40 ${animationsPlayed ? 'animate-fade-in' : ''}`} style={{ animationDelay: '0.2s' }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="px-4 sm:px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-blue-600 rounded-lg ${animationsPlayed ? 'animate-pop-in' : ''}`} style={{ animationDelay: '0.15s' }}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-2xl font-bold text-blue-600 ${animationsPlayed ? 'animate-fade-up' : ''}`} style={{ animationDelay: '0.2s' }}>Bookoustic</h1>
              </div>
              
              {renderAuthButtons()}
            </div>
          </header>

          {/* Hero Section */}
          <main className="px-4 sm:px-8 py-8 sm:py-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-sm font-medium ${animationsPlayed ? 'animate-pop-in' : ''}`} style={{ animationDelay: '0.25s' }}>
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Book Creation
                </div>
                <h1 className={`text-4xl sm:text-5xl md:text-7xl font-bold text-blue-600 leading-tight mt-6 ${animationsPlayed ? 'animate-fade-up' : ''} text-center`} style={{ animationDelay: '0.3s' }}>
                  Create Books with
                  <br className="hidden sm:block" />
                  <span className="text-blue-700"> Artificial Intelligence</span>
                </h1>
                <p className={`text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mt-4 ${animationsPlayed ? 'animate-fade-up' : ''} text-center`} style={{ animationDelay: '0.35s' }}>
                  Transform your ideas into professional books in minutes. Our advanced AI analyzes your description 
                  and crafts compelling narratives with rich characters, engaging plots, and polished prose.
                </p>
                <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 ${animationsPlayed ? 'animate-pop-in' : ''}`} style={{ animationDelay: '0.4s' }}>
                  {renderHeroButton()}
                </div>
              </div>
              {/* Features Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-16 mt-16 ${animationsPlayed ? 'animate-fade-up' : ''}`} style={{ animationDelay: '0.5s' }}>
                <Card className="p-6 sm:p-8 bg-white border-gray-200 shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">Lightning Fast</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Generate complete books in minutes, not months. Our AI understands narrative structure and creates 
                    compelling stories at unprecedented speed.
                  </p>
                </Card>

                <Card className="p-6 sm:p-8 bg-white border-gray-200 shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">Professional Quality</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Every book is crafted with attention to character development, plot coherence, and engaging prose 
                    that rivals traditionally published works.
                  </p>
                </Card>

                <Card className="p-6 sm:p-8 bg-white border-gray-200 shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">Multiple Genres</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    From sci-fi epics to romance novels, our AI adapts to any genre and creates authentic, 
                    engaging content tailored to your vision.
                  </p>
                </Card>
              </div>

              {/* CTA Section */}
              <Card className={`p-6 sm:p-12 bg-white border-gray-200 shadow-md text-center ${animationsPlayed ? 'animate-pop-in' : ''}`} style={{ animationDelay: '0.6s' }}>
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-3 sm:mb-4">Ready to Write Your Story?</h2>
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join thousands of authors who have already transformed their ideas into published books with Bookoustic.
                </p>
                {renderCTAButton()}
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  };

  // If user is not signed in, show landing page
  if (!isSignedIn) {
            return <LandingPage animationsPlayed={animationsPlayed} />;
  }

  // Render user button safely
  const renderUserButton = () => {
    try {
      return (
        <UserButton afterSignOutUrl="/" />
      );
    } catch (error) {
      return (
        <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
          <span className="sr-only">User menu</span>
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
            U
          </div>
        </Button>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-blue-600">Bookoustic</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
              
              {renderUserButton()}
            </div>
          </div>
          
          {/* Mobile navigation */}
          <div className="sm:hidden mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <nav className="flex items-center justify-between w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {activeTab === "create" && (
              <div className="space-y-8">
                {currentView === "form" && (
                  <>
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Book Creation
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-blue-600 leading-tight">
                        Craft Your Story
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Transform your ideas into compelling narratives. Describe your vision, 
                        choose your genre, and let AI help you create a professional book.
                      </p>
                    </div>

                    {/* Creation Form */}
                    <Card className="p-8 bg-white border-gray-200 shadow-md">
                      <div className="space-y-8">
                        {/* Book Description */}
                        <div className="space-y-3">
                          <Label htmlFor="description" className="text-lg font-semibold text-gray-800">
                            Describe Your Book
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the book you want to create. Be as detailed as possible about the plot, characters, setting, themes..."
                            value={bookDescription}
                            onChange={(e) => setBookDescription(e.target.value)}
                            className="min-h-32 bg-white border-gray-300 text-gray-800 resize-none focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                        </div>

                        {/* Author Tone */}
                        <div className="space-y-3">
                          <Label htmlFor="authorTone" className="text-lg font-semibold text-gray-800">
                            Author's Writing Tone
                          </Label>
                          <Textarea
                            id="authorTone"
                            placeholder="Describe the author's writing style and tone. Examples: serious and academic, gritty and dark, supportive and encouraging, feminist and empowering, humorous and witty, poetic and lyrical, formal and professional, casual and conversational..."
                            value={authorTone}
                            onChange={(e) => setAuthorTone(e.target.value)}
                            className="min-h-24 bg-white border-gray-300 text-gray-800 resize-none focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <p className="text-sm text-gray-500">
                            This will ensure the entire book maintains a consistent writing style and tone throughout.
                          </p>
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold text-gray-800">
                            Select Category
                          </Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-white border-gray-300 text-gray-800 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                              <SelectValue placeholder="Choose a genre for your book" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat.toLowerCase()} className="text-gray-800 focus:bg-blue-50 focus:text-blue-700">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Book Size */}
                        <div className="space-y-4">
                          <Label className="text-lg font-semibold text-gray-800">
                            Book Length
                          </Label>
                          <RadioGroup value={bookSize} onValueChange={setBookSize} className="space-y-3">
                            {bookSizes.map((size) => (
                              <div
                                key={size.id}
                                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                                  bookSize === size.id
                                    ? "border-blue-300 bg-blue-50 shadow-sm"
                                    : "border-gray-200 bg-gray-50 hover:border-blue-200"
                                }`}
                              >
                                <RadioGroupItem value={size.id} id={size.id} className="text-blue-600" />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={size.id}
                                    className="text-base font-medium text-gray-800 cursor-pointer"
                                  >
                                    {size.label}
                                  </Label>
                                  <p className="text-sm text-gray-500">
                                    {size.description}
                                  </p>
                                </div>
                                <div className="text-sm font-medium text-blue-600">
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
                          {...accentButtonProps}
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
                  <div className="text-center space-y-8">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Wand2 className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-blue-600">Writing Your Book</h2>
                      <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Our AI is crafting your {bookSizes.find(s => s.id === bookSize)?.label.toLowerCase()} 
                        based on your description. This process creates compelling narratives with rich characters and engaging plots.
                      </p>
                    </div>
                    
                    {/* Progress Animation */}
                    <Card className="p-8 bg-white border-gray-200 shadow-md max-w-2xl mx-auto">
                      <div className="space-y-6">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Progress</span>
                          <span>{Math.round(writingProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${writingProgress}%` }}
                          />
                        </div>
                        
                        {/* Writing stages */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 33 ? "bg-blue-50 text-blue-600" : "text-gray-500"
                          }`}>
                            <div className="text-sm font-medium">Plotting</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 66 ? "bg-blue-50 text-blue-600" : "text-gray-500"
                          }`}>
                            <div className="text-sm font-medium">Writing</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            writingProgress >= 99 ? "bg-blue-50 text-blue-600" : "text-gray-500"
                          }`}>
                            <div className="text-sm font-medium">Finalizing</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Book Preview */}
                {currentView === "preview" && bookContent && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={resetToForm}
                        className="flex items-center gap-2 border-gray-200"
                      >
                        Create New Book
                      </Button>
                    </div>
                    
                    <BookReader 
                      book={bookContent} 
                      isLoading={false} 
                      category={category} 
                      setPageContent={setPageContent} 
                      onClose={resetToForm}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Library Tab */}
            {activeTab === "library" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-blue-600">Your Library</h2>
                </div>
                {libraryBooks === null ? (
                  <div className="flex flex-col items-center justify-center py-16 text-blue-600 text-lg font-medium animate-pulse">
                    <span className="mb-2">Loading your library...</span>
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : libraryBooks.length === 0 ? (
                  <Card className="p-12 text-center bg-white border-gray-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Your Library is Empty</h3>
                    <p className="text-gray-600 mb-6">
                      Create and save books to build your personal library.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("create")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Create a Book
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraryBooks.map((book: any) => (
                      <Card key={book.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-all duration-300 w-48">
                        <div className="relative w-full" style={{ aspectRatio: '2/3', minHeight: 216, background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url}
                              alt={book.book_title || book.book_data?.title || "Book cover"}
                              className="object-contain h-full w-full rounded-md shadow-lg border border-gray-200"
                              style={{ maxHeight: '100%', maxWidth: '100%', background: '#fff', margin: '0 auto', display: 'block' }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-gray-300 text-5xl">
                              <BookOpen className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-gray-200">
                          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2">
                            {book.book_title || book.book_data?.title || "Untitled Book"}
                          </h3>
                          <div className="text-xs text-gray-500">
                            {new Date(book.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="p-3 bg-white flex justify-between">
                          <Button 
                            onClick={() => loadBookFromLibrary(book)}
                            {...accentOutlineButtonProps}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Read
                          </Button>
                          <Button 
                            onClick={() => { setBookToDelete(book); setShowDeleteDialog(true); }}
                            {...accentOutlineButtonProps}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Features Tab */}
            {activeTab === "features" && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    New Features Available
                  </div>
                  <h2 className="text-3xl font-bold text-blue-600">Explore New Features</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Discover the latest enhancements to Bookoustic - from reading progress tracking to AI-powered cover generation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Reading Progress */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Reading Progress</h3>
                    <p className="text-gray-600 mb-4">
                      Track your reading progress with detailed statistics, time estimates, and chapter navigation.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Real-time progress tracking
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Reading time estimates
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Chapter-by-chapter progress
                      </div>
                    </div>
                  </Card>

                  {/* Cover Generator */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <Palette className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">AI Cover Generator</h3>
                    <p className="text-gray-600 mb-4">
                      Create stunning book covers with AI assistance. Multiple styles and color palettes available.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        Multiple cover styles
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        Custom color palettes
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        Instant download
                      </div>
                    </div>
                  </Card>

                  {/* Chapter Generator */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chapter Generator</h3>
                    <p className="text-gray-600 mb-4">
                      Generate individual chapters on demand with full editing capabilities and progress tracking.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Individual chapter generation
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Full editing capabilities
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Word count tracking
                      </div>
                    </div>
                  </Card>

                  {/* EPUB Export */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">EPUB Export</h3>
                    <p className="text-gray-600 mb-4">
                      Export your books to EPUB format for compatibility with e-readers and reading apps.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                        E-reader compatible
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                        Professional formatting
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                        Metadata support
                      </div>
                    </div>
                  </Card>

                  {/* Theme Toggle */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                      <Sun className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Dark/Light Theme</h3>
                    <p className="text-gray-600 mb-4">
                      Switch between light and dark themes for optimal reading experience in any environment.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        Dark mode support
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        Light mode support
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        Smooth transitions
                      </div>
                    </div>
                  </Card>

                  {/* Try Features */}
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Try All Features</h3>
                    <p className="text-gray-600 mb-4">
                      Experience all the new features in our comprehensive demo page.
                    </p>
                    <Button 
                      onClick={() => window.open('/features-demo', '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Full Demo
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <History className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Generation History</h3>
                <p className="text-gray-600">Your book generation history will appear here</p>
              </div>
            )}
          </div>
        </main>
      </div>
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove Book?</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <span className="font-semibold">{bookToDelete?.book_title || bookToDelete?.book_data?.title || "this book"}</span> from your library? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (bookToDelete) {
                    await deleteBookFromLibrary(bookToDelete.id, !user);
                  }
                  setShowDeleteDialog(false);
                  setBookToDelete(null);
                }}
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {showAddDialog && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add to Library</DialogTitle>
              <DialogDescription>
                Would you like to add <span className="font-semibold">{bookContent?.title || "this book"}</span> to your personal library?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsSavingToLibrary(true);
                  await saveBookToLibrary();
                  setIsSavingToLibrary(false);
                  setShowAddDialog(false);
                }}
                disabled={isSavingToLibrary}
              >
                {isSavingToLibrary ? "Saving..." : "Add to Library"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 