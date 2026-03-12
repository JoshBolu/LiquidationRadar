const Footer = () => {
  return (
    <footer className="mt-12 border-t border-brand-border p-8 bg-brand-card/30 text-center text-xs text-slate-500">
      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-4">
        <div className="flex space-x-6">
          <a className="hover:text-brand-cyan transition-colors" href="#">
            Documentation
          </a>
          <a className="hover:text-brand-cyan transition-colors" href="#">
            Somnia Explorer
          </a>
          <a className="hover:text-brand-cyan transition-colors" href="#">
            Governance
          </a>
        </div>
        <p>© 2024 Liquidation Radar - Powered by Somnia Network Reactivity</p>
      </div>
    </footer>
  );
};

export default Footer;

