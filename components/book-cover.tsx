import { getFontForCategory } from "@/lib/book-fonts"

interface BookCoverProps {
  book: any
  category: string
}

export default function BookCover({ book, category }: BookCoverProps) {
  const font = getFontForCategory(category)
  const gold = '#e3c97b';
  const dark = '#28221b';

  return (
    <div 
      className="book-cover book-cover-capture h-full w-full flex flex-col items-center justify-center p-4 md:p-8"
      style={{
        background: dark,
        color: gold,
        height: '100%',
        width: '100%',
        minHeight: 0,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div className="flex flex-col items-center w-full" style={{ zIndex: 2 }}>
        <h1
          className="text-4xl md:text-5xl font-bold mb-4 text-center"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
            color: gold,
            letterSpacing: '0.01em',
            overflowWrap: 'anywhere',
          }}
        >
          {book.title}
        </h1>
        {book.subtitle && (
          <h2
            className="text-xl md:text-2xl italic mb-8 text-center"
            style={{
              fontFamily: `"${font.title}", serif`,
              color: gold,
              fontStyle: 'italic',
              fontWeight: 400,
              overflowWrap: 'anywhere',
            }}
          >
            {book.subtitle}
          </h2>
        )}
        {/* Thin line above author */}
        <div style={{ width: '100%', maxWidth: 340, borderTop: `1px solid ${gold}33`, margin: '2.5rem 0 0.5rem 0' }} />
        {/* Author with faint stamp behind */}
        <div className="relative flex flex-col items-center justify-center mb-2" style={{ minHeight: 80 }}>
          {/* Faint circular stamp */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: 'translate(-50%, -50%)',
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: `1.5px solid ${gold}22`,
              opacity: 0.18,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: gold,
                fontFamily: 'serif',
                fontSize: 18,
                opacity: 0.18,
                letterSpacing: 2,
                fontWeight: 700,
                overflowWrap: 'anywhere',
              }}
            >
              LIBRARY
            </span>
          </div>
          <span
            className="text-lg md:text-xl font-semibold text-center"
            style={{
              fontFamily: `"${font.body}", serif`,
              color: gold,
              position: 'relative',
              zIndex: 2,
              overflowWrap: 'anywhere',
            }}
          >
            By {book.author}
          </span>
        </div>
        {/* Thin line below author */}
        <div style={{ width: '100%', maxWidth: 340, borderTop: `1px solid ${gold}33`, margin: '0.5rem 0 0 0' }} />
          </div>
      {/* Footer */}
      <div className="flex flex-col items-center justify-center w-full" style={{ marginTop: 'auto' }}>
        <span
          className="text-sm"
          style={{ color: gold, fontFamily: `"${font.body}", serif`, overflowWrap: 'anywhere' }}
        >
          Generated with Bookoustic
        </span>
        <span
          className="text-sm mt-1"
          style={{ color: gold, fontFamily: `"${font.body}", serif`, overflowWrap: 'anywhere' }}
        >
          {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
