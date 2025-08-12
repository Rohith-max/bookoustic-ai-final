"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Download, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFontForCategory, getThemeForCategory } from "@/lib/book-fonts"
import dynamic from "next/dynamic"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase"
import { useUser, useAuth } from "@clerk/nextjs"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Dynamically import components with loading states
const BookCover = dynamic(() => import("./book-cover"), {
  loading: () => <div className="text-center py-12">Loading cover...</div>,
  ssr: false,
})
const BackCover = dynamic(() => import("./back-cover"), {
  loading: () => <div className="text-center py-12">Loading back cover...</div>,
  ssr: false,
})
const TitlePage = dynamic(() => import("./title-page"), {
  loading: () => <div className="text-center py-12">Loading title page...</div>,
  ssr: false,
})
const TableOfContents = dynamic(() => import("./table-of-contents"), {
  loading: () => <div className="text-center py-12">Loading table of contents...</div>,
  ssr: false,
})

interface BookReaderProps {
  book: any
  isLoading: boolean
  category: string
  setPageContent?: (pages: any[]) => void
  onClose: () => void;
  onPreviewReady?: () => void;
  libraryTimer?: number;
}

// Constants for page dimensions and limits
const PREVIEW_PAGE_WIDTH = 400
const PREVIEW_PAGE_HEIGHT = 600
const MOBILE_SCALE = 0.9
const MAX_WORDS_PER_PAGE = 200
const MOBILE_WORD_LIMIT_FACTOR = 0.35
const MOBILE_TITLE_PAGE_WORD_PENALTY = 25
const MOBILE_CHAR_LIMIT = 900
const MAX_PAGES = 1000

// Process chapters in chunks to avoid blocking
async function processChaptersInChunks(
  chapters: any[],
  onProgress: (progress: number) => void,
  isMobileView: boolean = false
): Promise<any[]> {
  const pages: any[] = [];
  let processedChapters = 0;

  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.error("Invalid chapters data:", chapters);
    return pages;
  }

  // Add front matter
  pages.push({ type: 'cover' });
  pages.push({ type: 'title' });
  pages.push({ type: 'toc' });

  try {
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      // Skip invalid chapters
      if (!chapter || !chapter.content) {
        console.warn(`Skipping invalid chapter at index ${i}:`, chapter);
          continue;
        }

        const chapterText = chapter.content;

      const paragraphs = chapterText.split(/\n{2,}/).map((p: string) => p.trim()).filter((p: string) => p);
      

      if (paragraphs.length === 0) {
        console.warn(`Chapter ${i} has no paragraphs:`, chapter);
          continue;
        }

        let currentPageContent: string[] = [];
        let wordCount = 0;
        let charCount = 0;
        let pageCount = 0;
        

      let adjustedWordLimit = Math.floor(MAX_WORDS_PER_PAGE * (isMobileView ? MOBILE_WORD_LIMIT_FACTOR : 0.8));
      if (isMobileView && pageCount === 0) {
        // Title page tends to have a title and spacing; lower limit slightly
        adjustedWordLimit = Math.max(80, adjustedWordLimit - MOBILE_TITLE_PAGE_WORD_PENALTY);
      }
      

        for (let paraIndex = 0; paraIndex < paragraphs.length; paraIndex++) {
        const para = paragraphs[paraIndex];
        const paraWordCount = para.split(/\s+/).length;
        const paraCharCount = para.length;

        // Strict mobile pagination using character limits to match visual layout
        if (isMobileView) {
          const charLimit = MOBILE_CHAR_LIMIT;

          if (charCount + paraCharCount > charLimit) {
            if (currentPageContent.length > 0) {
              // Close current page and start a new one
              pages.push({
                type: 'chapter',
                content: currentPageContent.join('\n\n'),
                chapterTitle: pageCount === 0 ? chapter.title : '',
                chapterIndex: i,
                pageNumber: pages.length + 1,
                continuesInNextPage: true,
              });
              pageCount++;
              currentPageContent = [para];
              charCount = paraCharCount;
              wordCount = paraWordCount;
            } else {
              // Split this long paragraph into sentence chunks that fit
              const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
              let chunkSentences: string[] = [];
              let chunkChars = 0;

              const flushChunkAsPage = () => {
                if (!chunkSentences.length) return;
                pages.push({
                  type: 'chapter',
                  content: chunkSentences.join(' ').trim(),
                  chapterTitle: pageCount === 0 ? chapter.title : '',
                  chapterIndex: i,
                  pageNumber: pages.length + 1,
                  continuesInNextPage: true,
                });
                pageCount++;
                chunkSentences = [];
                chunkChars = 0;
              };

              for (const sentence of sentences) {
                const sLen = sentence.trim().length + (chunkSentences.length > 0 ? 1 : 0);
                if (chunkChars + sLen > charLimit) {
                  flushChunkAsPage();
                  // If a single sentence is still too large, force it as a page
                  if (sentence.trim().length > charLimit) {
                    pages.push({
                      type: 'chapter',
                      content: sentence.trim(),
                      chapterTitle: pageCount === 0 ? chapter.title : '',
                      chapterIndex: i,
                      pageNumber: pages.length + 1,
                      continuesInNextPage: true,
                    });
                    pageCount++;
                  } else {
                    chunkSentences.push(sentence.trim());
                    chunkChars = sentence.trim().length;
                  }
                } else {
                  chunkSentences.push(sentence.trim());
                  chunkChars += sLen;
                }
              }

              if (chunkSentences.length > 0) {
                currentPageContent = [chunkSentences.join(' ').trim()];
                charCount = chunkChars;
                wordCount = currentPageContent[0].split(/\s+/).length;
              } else {
                currentPageContent = [];
                charCount = 0;
                wordCount = 0;
              }
            }
          } else {
            currentPageContent.push(para);
            charCount += paraCharCount + 2; // account for spacing
            wordCount += paraWordCount;
          }
          continue; // handled mobile branch
        }

        if (wordCount + paraWordCount > adjustedWordLimit) {

          if (currentPageContent.length === 0 && paraWordCount > adjustedWordLimit) {
 
            const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
            let currentSentences: string[] = [];
            let sentenceWordCount = 0;
            
            // Process each sentence
            for (const sentence of sentences) {
              const sentenceWords = sentence.trim().split(/\s+/).length;
              
              if (sentenceWordCount + sentenceWords > adjustedWordLimit) {
                // Add current sentences to page and start a new page
                if (currentSentences.length > 0) {
                  pages.push({
                    type: 'chapter',
                    content: pageCount === 0 ? currentSentences.join(' ') : currentSentences.join(' '),
                    chapterTitle: pageCount === 0 ? chapter.title : '',
                    chapterIndex: i,
                    pageNumber: pages.length + 1,
                    continuesInNextPage: true
                  });
                  
                  currentSentences = [sentence];
                  sentenceWordCount = sentenceWords;
                  pageCount++;
                } else {
                  // If a single sentence is too long, we have to include it anyway
                  currentSentences.push(sentence);
                  pages.push({
                    type: 'chapter',
                    content: currentSentences.join(' '),
                    chapterTitle: pageCount === 0 ? chapter.title : '',
                    chapterIndex: i,
                    pageNumber: pages.length + 1,
                    continuesInNextPage: true
                  });
                  
                  currentSentences = [];
                  sentenceWordCount = 0;
                  pageCount++;
                }
              } else {
                currentSentences.push(sentence);
                sentenceWordCount += sentenceWords;
              }
            }
            
            // Add any remaining sentences
            if (currentSentences.length > 0) {
              currentPageContent = [currentSentences.join(' ')];
              wordCount = sentenceWordCount;
            } else {
              currentPageContent = [];
              wordCount = 0;
            }
          } else {
            // Normal case: Add current page content and start a new page
            pages.push({
              type: 'chapter',
              content: currentPageContent.join('\n\n'),
              chapterTitle: pageCount === 0 ? chapter.title : '',
              chapterIndex: i,
              pageNumber: pages.length + 1,
              // If there are more paragraphs, mark as continuing
              continuesInNextPage: paraIndex < paragraphs.length - 1
            });
            
            // Start new page with this paragraph; if still too long on mobile, split by sentences
            if (isMobileView && paraWordCount > adjustedWordLimit) {
              const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
              let chunk: string[] = [];
              let chunkWords = 0;
              for (const s of sentences) {
                const sw = s.trim().split(/\s+/).length;
                if (chunkWords + sw > adjustedWordLimit) {
                  // push current chunk as its own page
                  pages.push({
                    type: 'chapter',
                    content: chunk.join(' '),
                    chapterTitle: '',
                    chapterIndex: i,
                    pageNumber: pages.length + 1,
                    continuesInNextPage: true
                  });
                  pageCount++;
                  chunk = [s];
                  chunkWords = sw;
                } else {
                  chunk.push(s);
                  chunkWords += sw;
                }
              }
              currentPageContent = chunk.length ? [chunk.join(' ')] : [];
              wordCount = chunkWords;
            } else {
            currentPageContent = [para];
            wordCount = paraWordCount;
            }
            pageCount++;
          }
          } else {
            // Add paragraph to current page
            currentPageContent.push(para);
            wordCount += paraWordCount;
          }
        }
        
        // Add final page if there's content left
        if (currentPageContent.length > 0) {
          pages.push({
            type: 'chapter',
            content: currentPageContent.join('\n\n'),
            chapterTitle: pageCount === 0 ? chapter.title : '',
          chapterIndex: i,
          pageNumber: pages.length + 1,
          continuesInNextPage: false // Last page of chapter
          });
        }

        processedChapters++;
        onProgress(Math.round((processedChapters / chapters.length) * 100));
      
      if (pages.length >= MAX_PAGES) {
        break;
      }
    }
  } catch (err) {
    console.error('Error in processChaptersInChunks:', err);
    throw err;
  }

  pages.push({ type: 'backcover' });
  return pages;
}

export function BookReader({
  book,
  category = "Fiction",
  isLoading,
  onClose,
  onPreviewReady,
  libraryTimer = 0,
}: BookReaderProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showAddToLibraryDialog, setShowAddToLibraryDialog] = useState(false);
  const [showRemoveFromLibraryDialog, setShowRemoveFromLibraryDialog] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isRemovingFromLibrary, setIsRemovingFromLibrary] = useState(false);
  const [canAddToLibrary, setCanAddToLibrary] = useState(false);
  const [bookData, setBookData] = useState<any>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const isMobile = useIsMobile();
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const computeScale = () => {
      if (!isMobile) {
        setPageScale(1);
        return;
      }
      const containerWidth = bookContainerRef.current?.clientWidth || PREVIEW_PAGE_WIDTH;
      const available = Math.max(0, containerWidth - 16);
      const scale = Math.min(available / PREVIEW_PAGE_WIDTH, 1);
      setPageScale(scale > 0 ? scale : 1);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [isMobile]);
  
  useEffect(() => {
    if (book) {
   
      const bookWithId = book.id ? { ...book, _libraryId: book.id } : book;
      setBookData(bookWithId);
    } else {
      
      setBookData({
        title: "Untitled Book",
        chapters: [],
        author: "Bookoustic AI"
      });
    }
  }, [book]);
  
  const processBook = async () => {
    if (!bookData || !bookData.chapters || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      console.log("Processing book:", { 
        title: bookData.title,
        chaptersLength: bookData.chapters?.length || 0,
        firstChapter: bookData.chapters?.[0]
      });

      const processedPages = await processChaptersInChunks(
        bookData.chapters,
        (progress) => {
        setProcessingProgress(progress);
        },
        isMobile
      );

      console.log("Processed pages:", processedPages.length);
      
      if (processedPages.length === 0) {
        setError("No pages could be processed from this book.");
        setIsProcessing(false);
        return;
      }

      setPages(processedPages);
      setPageIndex(0);
      setCanAddToLibrary(false);
      
      // Enable library addition after 7 seconds
      setTimeout(() => {
        setCanAddToLibrary(true);
      }, 7000);
    } catch (err: any) {
      console.error('Error processing book:', err);
      setError(`Failed to process book: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save book to library
  const saveBookToLibrary = async () => {
    if (!bookData || !user) return;
    
    try {
      setIsSavingToLibrary(true);
      
      const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) || 
                    (await getToken().catch(() => undefined)) || 
                    undefined;
      
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to authenticate with Supabase.",
        });
        setIsSavingToLibrary(false);
        return;
      }
      
      const supabase = getSupabaseClient(token);
      
      // Check if this book already exists in the library to avoid duplicates
      const { data: existingBooks, error: checkError } = await supabase
        .from("book_generations")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_title", bookData.title)
        .limit(1);
        
      if (checkError) {
        console.log("Error checking for existing book:", checkError);
        // Continue with insert attempt even if check fails
      } else if (existingBooks && existingBooks.length > 0) {
        toast({
          title: "Book Already Exists",
          description: "This book is already in your library.",
        });
        setIsSavingToLibrary(false);
        return;
      }
      
      // Extract cover data from the book
      let coverImageUrl = null;
      
      // First check if the book already has a cover image in the book data
      if (bookData.coverImageUrl) {
        coverImageUrl = bookData.coverImageUrl;
      } else {
        // If no existing cover image, try to create one from the DOM
        try {
          // Find the cover element in the DOM using the specific capture class
          const coverElement = document.querySelector('.book-cover-capture');
          
          if (coverElement) {
            try {
              // Use html2canvas to capture the cover as an image
              const html2canvas = (await import('html2canvas')).default;
              const canvas = await html2canvas(coverElement as HTMLElement, {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
              });
              
              // Convert canvas to data URL instead of blob for simplicity
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              
              // Store the data URL directly in the book data
              // This avoids storage bucket permission issues
              coverImageUrl = dataUrl;
            } catch (renderError) {
              console.error("Error rendering cover:", renderError);
            }
          }
        } catch (coverError) {
          console.error("Error capturing cover:", coverError);
        }
      }
      
      // Insert book data with cover image if available
      const { data, error } = await supabase
        .from("book_generations")
        .insert([
          {
            user_id: user.id,
            book_title: bookData.title,
            book_data: bookData,
            cover_image_url: coverImageUrl,
          },
        ]);
        
      if (error) {
        console.log("Supabase insert error:", error);
        toast({
          variant: "destructive",
          title: "Failed to Save",
          description: `Could not add book to your library: ${error.message || "Unknown error"}`,
        });
        return;
      }
      
      toast({
        title: "Book Saved",
        description: "Book has been added to your library.",
      });
      
    } catch (err: any) {
      console.error("Error saving to library:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save book to library: ${err.message || "Unknown error"}`,
      });
    } finally {
      setIsSavingToLibrary(false);
      setShowAddToLibraryDialog(false);
    }
  };

  // Remove book from library
  const removeBookFromLibrary = async () => {
    if (!bookData || !user || !bookData._libraryId) return;
    
    try {
      setIsRemovingFromLibrary(true);
      
      const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) || 
                    (await getToken().catch(() => undefined)) || 
                    undefined;
      
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to authenticate with Supabase.",
        });
        return;
      }
      
      const supabase = getSupabaseClient(token);
      
      // Delete the book from the database
      const { error } = await supabase
        .from("book_generations")
        .delete()
        .eq('id', bookData._libraryId);
        
      if (error) {
        console.error("Supabase delete error:", error);
        toast({
          variant: "destructive",
          title: "Failed to Remove",
          description: "Could not remove book from your library.",
        });
        return;
      }
      
      toast({
        title: "Book Removed",
        description: "Book has been removed from your library.",
      });
      
      // Close the book reader after successful removal
      if (onClose) {
        onClose();
      }
      
    } catch (err: any) {
      console.error("Error removing from library:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove book from library.",
      });
    } finally {
      setIsRemovingFromLibrary(false);
      setShowRemoveFromLibraryDialog(false);
    }
  };

  // Render page function
  const renderPage = (page: any) => {
    if (!page) return null;

    const themeClass = getThemeForCategory(category);
    const fontClass = getFontForCategory(category);

    switch (page.type) {
      case "cover":
        return <BookCover book={bookData} category={category} />;
      case "title":
        return <TitlePage book={bookData} category={category} />;
      case "toc":
        return <TableOfContents 
          book={bookData} 
          category={category} 
          onNavigate={(chapterIndex) => {
            // Find the first page of the selected chapter
            const chapterPageIndex = pages.findIndex(
              p => p.type === 'chapter' && p.chapterIndex === chapterIndex && p.chapterTitle
            );
            if (chapterPageIndex !== -1) {
              // Ensure we start at an even page for the spread
              setPageIndex(Math.floor(chapterPageIndex / 2) * 2);
            }
          }} 
        />;
      case "backcover":
        return <BackCover book={bookData} category={category} />;
      case "chapter":
        return (
          <div className={`chapter-page ${themeClass} ${fontClass}`}>
            <div className="p-8 h-full flex flex-col">
              {page.chapterTitle && (
                <h2 className="chapter-title">
                  {page.chapterTitle}
                </h2>
              )}
              <div className="chapter-content">
                {page.content.split('\n\n').map((paragraph: string, idx: number) => (
                  <p key={idx} className="mb-3 text-justify text-indent">{paragraph}</p>
                ))}
              </div>
              <div className="page-footer">
                {page.pageNumber && (
                  <span className="page-number">- {page.pageNumber} -</span>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <div>Unknown page type</div>;
    }
  };

  // PDF download function
  const handleDownloadPDF = async () => {
    if (!bookData) return;

    try {
      setIsDownloading(true);
      setPdfProgress(0);

      toast({
        title: "Creating PDF",
        description: "Generating your book as a PDF. This may take a moment...",
        duration: 10000, // Longer toast duration
      });

      // Set up the progress callback function with error handling
      if (typeof window !== 'undefined') {
        (window as any).pdfGenerationProgress = (progress: number) => {
          // Prevent progress from getting stuck at high values
          if (progress <= 100) {
          setPdfProgress(progress);
          }
          
          // If progress is high but not complete, show additional feedback
          if (progress >= 95 && progress < 100) {
            toast({
              title: "Almost done",
              description: "Finalizing your PDF...",
              duration: 5000,
            });
          }
        };
      }

      // Set a timeout to ensure the process doesn't hang indefinitely
      const pdfTimeout = setTimeout(() => {
        if (isDownloading) {
          toast({
            variant: "destructive",
            title: "PDF Generation Taking Too Long",
            description: "The process might be stuck. Try again with a smaller book.",
          });
          setIsDownloading(false);
          setPdfProgress(0);
          if (typeof window !== 'undefined') {
            (window as any).pdfGenerationProgress = null;
          }
        }
      }, 60000); // 1 minute timeout

      const pdfDataUri = await generatePDF(bookData, category, renderPage, pages);
      
      // Clear the timeout since we succeeded
      clearTimeout(pdfTimeout);
      
      setPdfProgress(100);

      // Create a download link
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = `${bookData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "PDF Ready",
        description: "Your book has been downloaded as a PDF.",
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: `There was an error creating your PDF: ${error.message || "Unknown error"}. Please try again.`,
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setPdfProgress(0), 1000);
      // Clean up the progress callback
      if (typeof window !== 'undefined') {
        (window as any).pdfGenerationProgress = null;
      }
    }
  };
  
  // Process book when it changes
  useEffect(() => {
    if (bookData && bookData.chapters && bookData.chapters.length > 0) {
      console.log("Book data received:", {
        title: bookData.title,
        chaptersCount: bookData.chapters.length,
        hasChapters: Array.isArray(bookData.chapters) && bookData.chapters.length > 0,
        firstChapter: bookData.chapters[0]
      });
      processBook().then(() => {
        if (onPreviewReady) onPreviewReady();
      });
    } else if (bookData) {
      // Only log an error if bookData exists but has no chapters
      console.log("Book data missing chapters:", bookData);
      setError("Book data is missing chapters. Please try again.");
    }
    // Don't log an error for null bookData as it's handled in the first useEffect
  }, [bookData]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if book is loaded
      if (!pages.length) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageIndex, pages.length]);

  const handleNextPage = () => {
    if (isMobile) {
      if (pageIndex < pages.length - 1) {
        setPageIndex(prev => prev + 1);
      }
    } else {
      if (pageIndex < pages.length - 2) {
        setPageIndex(prev => prev + 2);
      }
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      setPageIndex(prev => prev - (isMobile ? 1 : 2));
    }
  };

  // Render the book UI
  const renderBookUI = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-center">Processing book... {processingProgress}%</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => processBook()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!bookData || !bookData.chapters) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-amber-600">Invalid book data. Missing chapters.</p>
        </div>
      );
    }

    if (pages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-amber-600">No pages available. The book may be empty or still processing.</p>
        </div>
      );
    }

    // Show cover as a single page first
    if (pageIndex === 0) {
      return (
        <div className="book-view">
          <div className="book-controls mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex gap-2">
                          <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddToLibraryDialog(true)}
              disabled={!canAddToLibrary}
              className={!canAddToLibrary ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Plus className="h-4 w-4 mr-1" /> Add to Library
              {libraryTimer > 0 && (
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                  {libraryTimer}s
                </span>
              )}
                    </Button>
              
              {/* Only show remove button if book has an ID (meaning it's from the library) */}
              {bookData._libraryId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRemoveFromLibraryDialog(true)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
              )}
                </div>
                
            <div className="flex items-center">
              <span className="mr-4">
                Cover
              </span>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage}
              >
                <ChevronRight className="h-4 w-4" />
                    </Button>
          </div>
          
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" /> Download PDF
                    </Button>
            </div>
          
          <div className="book-content flex justify-center">
            {isMobile ? (
              <div className="book-page-wrapper" style={{ width: PREVIEW_PAGE_WIDTH * pageScale, height: PREVIEW_PAGE_HEIGHT * pageScale }}>
                <div className="book-page shadow-lg" style={{ width: PREVIEW_PAGE_WIDTH, height: PREVIEW_PAGE_HEIGHT, transform: `scale(${pageScale})`, transformOrigin: 'top left' }}>
                  {renderPage(pages[0])}
                </div>
              </div>
            ) : (
              <div style={{ width: PREVIEW_PAGE_WIDTH, height: PREVIEW_PAGE_HEIGHT }} className="book-page shadow-lg">
                {renderPage(pages[0])}
              </div>
            )}
          </div>
          
          {/* PDF progress indicator at bottom */}
          {isDownloading && (
            <div className="pdf-progress-bar mt-4 p-4 bg-background/80 rounded-lg border border-border/50">
              <div className="text-sm mb-2">Creating PDF... {pdfProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${pdfProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For non-cover pages, render single page on mobile, two-page spread on desktop
    if (isMobile) {
      return (
        <div className="book-view">
          <div className="book-controls mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddToLibraryDialog(true)}
                disabled={!canAddToLibrary}
                className={!canAddToLibrary ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Plus className="h-4 w-4 mr-1" /> Add to Library
                {libraryTimer > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                    {libraryTimer}s
                  </span>
                )}
              </Button>
              {bookData._libraryId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRemoveFromLibraryDialog(true)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
              onClick={handlePrevPage} 
                disabled={pageIndex === 0}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
              <span className="mx-4">Page {pageIndex + 1} / {pages.length}</span>
            <Button 
                variant="outline" 
                size="sm" 
              onClick={handleNextPage} 
                disabled={pageIndex >= pages.length - 1}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>
          <div className="book-content flex justify-center">
            <div className="book-page-wrapper" style={{ width: PREVIEW_PAGE_WIDTH * pageScale, height: PREVIEW_PAGE_HEIGHT * pageScale }}>
              <div className="book-page shadow-lg" style={{ width: PREVIEW_PAGE_WIDTH, height: PREVIEW_PAGE_HEIGHT, transform: `scale(${pageScale})`, transformOrigin: 'top left' }}>
                {renderPage(pages[pageIndex])}
              </div>
            </div>
          </div>
          {isDownloading && (
            <div className="pdf-progress-bar mt-4 p-4 bg-background/80 rounded-lg border border-border/50">
              <div className="text-sm mb-2">Creating PDF... {pdfProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${pdfProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Two-page spread for all other pages (desktop)
    return (
      <div className="book-view">
        <div className="book-controls mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddToLibraryDialog(true)}
              disabled={!canAddToLibrary}
              className={!canAddToLibrary ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Plus className="h-4 w-4 mr-1" /> Add to Library
              {libraryTimer > 0 && (
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                  {libraryTimer}s
                </span>
              )}
                  </Button>
            
            {/* Only show remove button if book has an ID (meaning it's from the library) */}
            {bookData._libraryId && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRemoveFromLibraryDialog(true)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
            )}
            </div>
            
            <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage} 
              disabled={pageIndex === 0}
                    >
              <ChevronLeft className="h-4 w-4" />
                    </Button>
            
            <span className="mx-4">
              Pages {pageIndex + 1}-{Math.min(pageIndex + 2, pages.length)}
            </span>
            
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage} 
              disabled={pageIndex >= pages.length - 2}
                    >
              <ChevronRight className="h-4 w-4" />
                    </Button>
            </div>
            
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download PDF
                  </Button>
        </div>
        
        <div className="book-content flex justify-center">
          <div className="book-spread flex shadow-lg">
            <div className="book-page left-page border-r w-[400px] max-w-full aspect-[2/3]" style={{ height: isMobile ? undefined : PREVIEW_PAGE_HEIGHT, width: isMobile ? undefined : PREVIEW_PAGE_WIDTH }}>
              {renderPage(pages[pageIndex])}
            </div>
            <div className="book-page right-page w-[400px] max-w-full aspect-[2/3]" style={{ height: isMobile ? undefined : PREVIEW_PAGE_HEIGHT, width: isMobile ? undefined : PREVIEW_PAGE_WIDTH }}>
              {pageIndex + 1 < pages.length && renderPage(pages[pageIndex + 1])}
            </div>
          </div>
        </div>
        
        {/* PDF progress indicator at bottom */}
        {isDownloading && (
          <div className="pdf-progress-bar mt-4 p-4 bg-background/80 rounded-lg border border-border/50">
            <div className="text-sm mb-2">Creating PDF... {pdfProgress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${pdfProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={bookContainerRef}
      className="book-reader-container bg-background/80 backdrop-blur-sm rounded-xl p-4 sm:p-8 shadow-lg sm:shadow-xl border-0 sm:border border-border/50 max-w-4xl mx-auto"
    >
      {renderBookUI()}
      
      {/* Add to Library Dialog */}
      <AlertDialog open={showAddToLibraryDialog} onOpenChange={setShowAddToLibraryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Library</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add "{bookData?.title}" to your personal library?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={saveBookToLibrary}
              disabled={isSavingToLibrary}
            >
              {isSavingToLibrary ? "Saving..." : "Add to Library"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Remove from Library Dialog */}
      <AlertDialog open={showRemoveFromLibraryDialog} onOpenChange={setShowRemoveFromLibraryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Library</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{bookData?.title}" from your library? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={removeBookFromLibrary}
              disabled={isRemovingFromLibrary}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRemovingFromLibrary ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add professional book styles
const bookStyles = `
  .book-spread {
    background: linear-gradient(to right, #f0f0f0, #ffffff, #f0f0f0);
    border-radius: 4px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    position: relative;
  }
  
  .book-spread:after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 4px;
    background: rgba(0, 0, 0, 0.06);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    transform: translateX(-50%);
  }
  
  .book-page {
    background: #ffffff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .left-page {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  .right-page {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
  
  .chapter-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    font-family: 'Georgia', serif;
    color: #333;
    text-align: center;
  }

  .chapter-content {
    font-size: 0.85rem;
    line-height: 1.5;
    text-align: justify;
    overflow: hidden;
    font-family: 'Georgia', serif;
    color: #333;
    padding-bottom: 2.5rem; /* Extra padding to ensure space for footer */
    flex: 1;
  }
  
  .chapter-content p:last-child {
    margin-bottom: 0;
  }
  
  .text-indent {
    text-indent: 1.5rem;
  }
  
  .page-footer {
    width: 100%;
    text-align: center;
    padding-top: 0.75rem;
    margin-top: auto;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    position: absolute;
    bottom: 1.5rem;
    left: 0;
    right: 0;
  }
  
  .page-number {
    font-style: italic;
    color: #666;
    font-size: 0.8rem;
    display: inline-block;
  }
  
  /* Table of Contents Styling */
  .toc-container {
    font-size: 0.85rem !important;
    line-height: 1.4 !important;
  }
  
  .toc-title {
    font-size: 1.2rem !important;
    margin-bottom: 1rem !important;
  }
  
  .toc-chapter {
    font-size: 0.9rem !important;
    margin-bottom: 0.5rem !important;
  }
  
  .toc-page-number {
    font-size: 0.85rem !important;
  }
  
  .chapter-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .chapter-page > div {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    padding-bottom: 3rem; /* Ensure space for footer */
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = bookStyles;
  document.head.appendChild(style);
}
