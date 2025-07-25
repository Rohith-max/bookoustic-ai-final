"use client"

import { getFontForCategory } from "@/lib/book-fonts"

interface TableOfContentsProps {
  book: any
  category: string
  onNavigate: (chapterIndex: number) => void
}

export default function TableOfContents({ book, category, onNavigate }: TableOfContentsProps) {
  const font = getFontForCategory(category)
  const gold = '#e3c97b'
  const dark = '#28221b'

  return (
    <div
      className="table-of-contents h-full w-full flex flex-col items-center p-4 md:p-8 min-h-full toc-container text-[8px] sm:text-[7px] space-y-2"
      style={{
        background: dark,
        color: gold,
        height: '100%',
        width: '100%',
        minHeight: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div className="flex flex-col items-center w-full max-w-2xl" style={{ zIndex: 2 }}>
        <h2
          className="text-[10px] md:text-xs font-bold mb-4 text-center toc-title"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
            color: gold,
            letterSpacing: '0.01em',
            overflowWrap: 'anywhere',
          }}
        >
          Table of Contents
        </h2>

        {/* Gold divider */}
        <div style={{ width: 100, borderTop: `2px solid ${gold}66`, margin: '0 0 1.5rem 0' }} />

        {/* List of chapters */}
        <div className="w-full space-y-1">
          {book.chapters?.map((chapter: any, index: number) => {
            const chapterTitle = chapter.title.replace(/^Chapter \d+:\s*/i, '');
            return (
              <div
                key={index}
                className="w-full flex items-center gap-2 py-1 cursor-pointer group toc-chapter font-medium mb-1"
                style={{ fontFamily: `"${font.body}", serif`, color: gold, fontSize: 4, fontWeight: 500, letterSpacing: 0.3 }}
                onClick={() => onNavigate(index)}
              >
                <span className="mr-1 text-[7px]" style={{ color: gold, opacity: 0.8 }}>▫</span>
                <span className="flex-1 text-left" style={{ overflowWrap: 'anywhere' }}>
                  Chapter {index + 1}: {chapterTitle}
                </span>
                <span className="flex-1 mx-2 border-t border-amber-400/30 border-dotted" />
                <span className="ml-2 text-right toc-page-number text-[7px] ml-2" style={{ color: gold, fontWeight: 600, minWidth: 4, fontSize: 4 }}>{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
