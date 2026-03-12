import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans antialiased">
      <Header />
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

