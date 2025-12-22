import { getFontForCategory } from "@/lib/book-fonts"

interface BackCoverProps {
  book: any
  category: string
}

export default function BackCover({ book, category }: BackCoverProps) {
  const font = getFontForCategory(category)
  const gold = '#e3c97b';
  const dark = '#28221b';

  return (
    <div
      className="book-back-cover h-full w-full flex flex-col items-center p-4 md:p-8 min-h-full text-sm sm:text-xs"
      style={{
        background: dark,
        color: gold,
        height: '100%',
        width: '100%',
        minHeight: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div className="flex flex-col items-center w-full flex-grow" style={{ zIndex: 2 }}>
        <h2
          className="text-xl md:text-2xl font-bold mb-2 text-center"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
            color: gold,
            letterSpacing: '0.01em',
            overflowWrap: 'anywhere',
          }}
        >
          About this Book
        </h2>
        
        <div style={{ width: '100%', maxWidth: 340, borderTop: `1px solid ${gold}33`, margin: '0 0 1.5rem 0' }} />
       
        <div className="mb-4 text-base leading-relaxed text-center" style={{ fontFamily: `"${font.body}", serif`, color: gold, overflowWrap: 'anywhere' }}>
          {book.backCoverText}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-end w-full pb-2" style={{ minHeight: 0 }}>
        <span className="text-xs" style={{ color: gold, fontFamily: `"${font.body}", serif`, overflowWrap: 'anywhere' }}>
          A Bookoustic Publication
        </span>
        <div className="h-6 w-40 bg-transparent border border-[rgba(227,201,123,0.4)] rounded-sm flex items-center justify-center mt-2">
          <div className="text-[10px] font-mono" style={{ color: gold, opacity: 0.7, overflowWrap: 'anywhere' }}>ISBN 978-0-00000-000-0</div>
        </div>
      </div>
    </div>
  )
}
