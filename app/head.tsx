import { getAllFontsUrl } from "@/lib/book-fonts";

export default function Head() {
  return (
    <>
      <link rel="stylesheet" href={getAllFontsUrl()} />
    </>
  );
} 