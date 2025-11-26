import ThemeSwitcher from '@/components/ThemeSwitcher';

const Header = () => {
  return (
    <header className="bg-card border-b border-border p-4 h-20 flex items-center justify-between">
      <div></div>
      <div className="flex items-center">
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;
