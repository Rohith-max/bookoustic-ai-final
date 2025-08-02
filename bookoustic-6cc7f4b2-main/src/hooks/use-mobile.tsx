import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      console.log('Mobile check:', mobile, 'Width:', window.innerWidth)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize events
    window.addEventListener("resize", checkMobile)
    
    // Also listen for media query changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => checkMobile()
    mql.addEventListener("change", onChange)
    
    return () => {
      window.removeEventListener("resize", checkMobile)
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}
