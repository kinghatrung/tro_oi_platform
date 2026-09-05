import Header from "@/components/layout/Header";
import { SearchInput } from "@/components/ui";

export default function Home() {
  return (
    <section
      className="relative w-full min-h-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/bg-trooi.png')" }}
    >
      <Header />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-full max-w-150 px-4">
        <SearchInput />
      </div>
    </section>
  );
}
