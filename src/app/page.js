import { Inter } from 'next/font/google'
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Home from "@/components/landing-page/home";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='${inter.className} min-h-screen flex flex-col'>
        <Navbar />
        <main className="flex-grow pt-16">
          <Home/>
        </main>
        <Footer />
      </body>
    </html>
  );
}
