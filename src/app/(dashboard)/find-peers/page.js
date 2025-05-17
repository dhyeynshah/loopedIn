import FindPeers from "@/components/dashboard/search";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Sidebar from "@/components/dashboard/sidebar";

export default function SearchPage() {
  return (
    <>
      <Navbar className="z-10 relative" />
      <div className="flex flex-grow">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-grow mt-20">
          <FindPeers />
        </main>
      </div>
      <Footer className="z-10 relative" />
    </>
  );
}