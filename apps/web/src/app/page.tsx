import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SearchInput } from "@/components/ui";

export default function Home() {
  return (
    <main>
      <section
        className="relative w-full min-h-55 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/phan1_tren.png')" }}
      >
        <Header />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-full max-w-250 px-4 z-100">
          <SearchInput />
        </div>
      </section>

      <section
        className="w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/phan2_duoi.png')" }}
      >
        <div className="w-full max-w-7xl mx-auto">adasd</div>
      </section>

      <Footer />
    </main>
  );
}
