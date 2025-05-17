import ProfileForm from "@/components/dashboard/profile_form";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Sidebar from "@/components/dashboard/sidebar";

export default function ProfilePage() {
  return (
    <>
      <Navbar className="z-10 relative" />
      <div className="flex flex-grow">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-grow">
          <ProfileForm />
        </main>
      </div>
      <Footer className="z-10 relative" />
    </>
  );
}