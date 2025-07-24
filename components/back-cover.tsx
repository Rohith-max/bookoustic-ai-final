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
      className="book-back-cover h-full w-full flex flex-col items-center p-4 md:p-8 min-h-full"
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
          className="text-3xl md:text-4xl font-bold mb-4 text-center"
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
        {/* Thin gold divider */}
        <div style={{ width: '100%', maxWidth: 340, borderTop: `1px solid ${gold}33`, margin: '0 0 2.5rem 0' }} />
        {/* Back cover blurb */}
        <div className="mb-8 text-lg leading-relaxed text-center" style={{ fontFamily: `"${font.body}", serif`, color: gold, overflowWrap: 'anywhere' }}>
          {book.backCoverText}
        </div>
      </div>
      {/* Footer */}
      <div className="flex flex-col items-center justify-end w-full pb-2" style={{ minHeight: 0 }}>
        <span className="text-sm" style={{ color: gold, fontFamily: `"${font.body}", serif`, overflowWrap: 'anywhere' }}>
          A Bookoustic Publication
        </span>
        <div className="h-8 w-48 bg-transparent border border-[rgba(227,201,123,0.4)] rounded-sm flex items-center justify-center mt-2">
          <div className="text-xs font-mono" style={{ color: gold, opacity: 0.7, overflowWrap: 'anywhere' }}>ISBN 978-0-00000-000-0</div>
        </div>
      </div>
    </div>
  )
}
