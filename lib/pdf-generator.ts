import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import * as ReactDOM from "react-dom/client"

const DEBUG = true; // Set to true to enable verbose logging

function logDebug(...args: any[]) {
  if (DEBUG) {
    console.log('[PDF Generator Debug]', ...args);
  }
}

function logError(...args: any[]) {
  console.error('[PDF Generator Error]', ...args);
}

export async function generatePDF(
  bookContent: any,
  category: string,
  renderPageFunction?: ((page: any, category: string) => any) | null,
  pages?: any[] // Pass the already-paginated preview content
): Promise<string> {
  try {
    logDebug('Starting PDF generation', {
      title: bookContent.title,
      category,
      hasRenderFunction: !!renderPageFunction,
      pagesProvided: !!pages
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [490, 635],
    })

    pdf.setProperties({
      title: bookContent.title,
      subject: "Generated with Bookoustic",
      author: bookContent.author || "Bookoustic AI",
      keywords: `${category}, AI-generated book`,
      creator: "Bookoustic",
    })

    // Create a temporary container for rendering pages
    const tempContainer = document.createElement("div")
    tempContainer.style.position = "absolute"
    tempContainer.style.left = "-9999px"
    tempContainer.style.top = "-9999px"
    tempContainer.style.width = "490px"
    tempContainer.style.height = "635px"
    tempContainer.style.overflow = "hidden"
    document.body.appendChild(tempContainer)

    // Use the provided pages array if available, otherwise generateBookPages
    const pageContent = pages || generateBookPages(bookContent, category)
    const totalPages = pageContent.length

    logDebug(`Processing ${totalPages} pages for PDF`);

    // Add a progress callback
    const progressCallback = typeof window !== "undefined" ? (window as any).pdfGenerationProgress : null

    // Process pages in smaller batches to prevent UI freezing
    const BATCH_SIZE = 5; // Process 5 pages at a time
    const batches = Math.ceil(totalPages / BATCH_SIZE);

    try {
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalPages);
        
        // Process each page in the current batch
        for (let i = batchStart; i < batchEnd; i++) {
          const page = pageContent[i];
          const currentProgress = Math.round((i / totalPages) * 100);
          
          // Update progress
          if (progressCallback && typeof progressCallback === "function") {
            progressCallback(currentProgress);
        }
        
        try {
          logDebug(`Rendering page ${i + 1}/${totalPages} (${page.type})`);
          
          // Render the page content
            const pageElement = document.createElement("div");
            pageElement.className = "book-content";
            pageElement.style.width = "490px";
            pageElement.style.height = "635px";
            pageElement.style.position = "absolute";
            pageElement.style.left = "0";
            pageElement.style.top = "0";
            pageElement.style.boxShadow = "none";
            pageElement.style.border = "none";
            pageElement.style.background = "white";
            pageElement.style.fontSize = "14pt";
            pageElement.style.lineHeight = "1.6";
            pageElement.style.margin = "0";
            pageElement.style.padding = "0";
            pageElement.style.overflow = "hidden";
            tempContainer.innerHTML = "";
            tempContainer.appendChild(pageElement);
          
          // Only use renderPageFunction if provided
          let root;
          if (renderPageFunction) {
            logDebug(`Using custom render function for page ${i + 1}`);
              root = ReactDOM.createRoot(pageElement);
              const jsx = renderPageFunction(page, category);
              root.render(jsx);
              await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced timeout
          } else {
            // Fallback rendering for when no renderPageFunction is provided
            logDebug(`Using fallback rendering for page ${i + 1}`);
            pageElement.innerHTML = `
              <div style="padding: 40px; height: 100%; display: flex; flex-direction: column;">
                  <div style="text-align: center; margin-bottom: 20px; font-size: 18px;">
                    ${page.chapterTitle ? `<h2 style="font-size: 28px; margin-bottom: 20px;">${page.chapterTitle}</h2>` : ''}
                  ${page.type === 'chapter' ? `<div>Chapter ${page.chapterIndex + 1}</div>` : ''}
                </div>
                  <div style="flex: 1; font-size: 16px; line-height: 1.6;">
                  ${page.content || ''}
                </div>
                <div style="text-align: center; margin-top: 20px;">
                  ${page.pageNumber ? `-${page.pageNumber}-` : ''}
                </div>
              </div>
            `;
              await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced timeout
          }
          
          logDebug(`Capturing page ${i + 1} as canvas`);
            
            // Optimize html2canvas settings for better performance
          const canvas = await html2canvas(pageElement, {
              scale: 1.5, // Reduced from 2 for better performance
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 490,
            height: 635,
            windowWidth: 490,
            windowHeight: 635,
              onclone: (document) => {
                // Additional optimization if needed
                const clonedElement = document.querySelector('.book-content') as HTMLElement;
                if (clonedElement) {
                  clonedElement.style.willChange = 'auto';
                }
              }
            });
            
          if (i > 0) {
              pdf.addPage();
            }
            
            const imgData = canvas.toDataURL("image/jpeg", 0.92); // Reduced quality for better performance
            pdf.addImage(imgData, "JPEG", 0, 0, 490, 635);
            
          if (root) {
              root.unmount();
          }
            
          logDebug(`Page ${i + 1} added to PDF`);
        } catch (pageError) {
            logError(`Error rendering page ${i + 1}:`, pageError);
            // Add a simple error page instead
            if (i > 0) pdf.addPage();
            pdf.setFontSize(16);
            pdf.setTextColor(200, 0, 0);
            pdf.text(`Error rendering page ${i + 1}`, 20, 40);
          }
        }
        
        // After each batch, yield to the event loop and update progress
        await new Promise(r => setTimeout(r, 10));
        
        // Update progress after batch completion
        const batchProgress = Math.round((batchEnd / totalPages) * 100);
        if (progressCallback && typeof progressCallback === "function") {
          progressCallback(batchProgress);
        }
      }
      
      // Set final progress to 99% before outputting PDF
      if (progressCallback && typeof progressCallback === "function") {
        progressCallback(99);
      }
      
      // Generate the PDF data URI
      logDebug('Generating final PDF output');
      const pdfOutput = pdf.output("datauristring");
      
      // Set final progress to 100% after PDF is generated
      if (progressCallback && typeof progressCallback === "function") {
        progressCallback(100);
      }
      
      logDebug('PDF generation complete');
      return pdfOutput;
      
    } catch (processingError: unknown) {
      logError("Error during PDF page processing:", processingError);
      
      // Try to return a partial PDF if possible
      try {
        if (progressCallback && typeof progressCallback === "function") {
          progressCallback(99); // Show near-completion
        }
        return pdf.output("datauristring");
      } catch (outputError) {
        throw new Error("Failed to generate PDF: " + (processingError as Error).message);
      }
    } finally {
      // Always clean up
      document.body.removeChild(tempContainer);
      if (progressCallback && typeof progressCallback === "function") {
        progressCallback(100);
      }
    }
  } catch (error) {
    logError("Error generating PDF:", error);
    throw new Error("Failed to generate PDF: " + (error as Error).message);
  }
}

// Utility to split HTML content into pages by rendered height (for PDF)
function paginateByHeightPDF(paragraphs: string[], pageHeightPx: number, font: any, theme: any, chapterTitle?: string) {
  if (typeof window === "undefined") return [];
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.visibility = "hidden";
  tempDiv.style.width = "210mm";
  tempDiv.style.fontFamily = `"${font.body}", serif`;
  tempDiv.style.fontSize = "1.25rem";
  tempDiv.style.lineHeight = "1.8";
  tempDiv.style.padding = "2.5rem";
  tempDiv.style.background = theme.contentPage?.backgroundColor || "#fff";
  document.body.appendChild(tempDiv);

  const pages: any[] = [];
  let currentPageContent = "";
  let isFirstPage = true;
  let pageCount = 0;
  let i = 0;
  while (i < paragraphs.length) {
    // Force page break if paragraph is exactly '---PAGEBREAK---'
    if (paragraphs[i].trim() === '---PAGEBREAK---') {
      if (currentPageContent.trim() !== "") {
        pages.push({
          type: "chapter",
          content: currentPageContent,
          chapterTitle: isFirstPage ? chapterTitle : "",
          chapterIndex: undefined, // will be set by caller
          pageNumber: pageCount + 1,
        });
        currentPageContent = "";
        isFirstPage = false;
        pageCount++;
      }
      i++;
      continue;
    }
    let testContent = currentPageContent + paragraphs[i];
    tempDiv.innerHTML = testContent;
    if (tempDiv.scrollHeight > pageHeightPx && currentPageContent !== "") {
      pages.push({
        type: "chapter",
        content: currentPageContent,
        chapterTitle: isFirstPage ? chapterTitle : "",
        chapterIndex: undefined, // will be set by caller
        pageNumber: pageCount + 1,
      });
      currentPageContent = "";
      isFirstPage = false;
      pageCount++;
      // do not increment i
    } else {
      currentPageContent = testContent;
      i++;
    }
  }
  if (currentPageContent.trim() !== "") {
    pages.push({
      type: "chapter",
      content: currentPageContent,
      chapterTitle: isFirstPage ? chapterTitle : "",
      chapterIndex: undefined, // will be set by caller
      pageNumber: pageCount + 1,
    });
  }
  document.body.removeChild(tempDiv);
  return pages;
}

// Helper function to generate all book pages with dynamic chapter scaling
function generateBookPages(book: any, category: string): any[] {
  if (!book) return []

  const pages = []

  // Front cover
  pages.push({ type: "cover", content: book })

  // Table of contents
  pages.push({ type: "toc", content: book })

  // Title page
  pages.push({ type: "title", content: book })

  // Chapters with dynamic scaling
  if (book.chapters && Array.isArray(book.chapters)) {
    const { getFontForCategory, getThemeForCategory } = require("@/lib/book-fonts");
    const font = getFontForCategory(category);
    const theme = getThemeForCategory(category);
    const pageHeightPx = 1122; // 297mm at 96dpi (A4)

    book.chapters.forEach((chapter: any, chapterIndex: number) => {
      // Skip empty chapters
      if (!chapter.content || chapter.content.trim() === "") {
        return
      }

      // Split chapter content into paragraphs
      const paragraphs = chapter.content.split("\n").filter((p: string) => p.trim() !== "").map(formatParagraph);

      // Create pages for this chapter
      const chapterPages = paginateByHeightPDF(paragraphs, pageHeightPx, font, theme, chapter.title).map((p, idx) => ({
        ...p,
        chapterIndex,
        pageNumber: idx + 1,
      }));
      pages.push(...chapterPages);
    })
  }

  // Back cover
  pages.push({ type: "backcover", content: book })

  return pages
}

// Helper function to format paragraphs with proper indentation and spacing
function formatParagraph(paragraph: string): string {
  // Check if this is dialogue (starts with a quote or dash)
  if (paragraph.trim().startsWith('"') || paragraph.trim().startsWith("-") || paragraph.trim().startsWith('"')) {
    return `<p class="dialogue" style="margin-bottom: 1.2em; text-indent: 0;">${paragraph}</p>`
  }

  // Check if this is a section break
  if (paragraph.trim() === "***" || paragraph.trim() === "---" || paragraph.trim() === "___") {
    return `<div class="section-break" style="text-align: center; margin: 1.5em 0;">***</div>`
  }

  // Regular paragraph with text indent
  return `<p style="text-indent: 1.5em; margin-bottom: 1.2em;">${paragraph}</p>`
}
