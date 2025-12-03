import ThemeSwitcher from '@/components/ThemeSwitcher';
import Notifications from '@/components/Notifications';

const Header = ({ showNotifications }) => {
  return (
    <header className="bg-card border-b border-border p-4 h-20 flex items-center justify-between">
      <div></div>
      <div className="flex items-center space-x-4">
        {showNotifications && <Notifications />}
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;
