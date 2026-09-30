import {
  LayoutGrid,
  Radio,
  Music,
  Mic2,
  Disc,
  ListMusic,
  Heart,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import Brand from './Brand';
import UserProfile from './UserProfile';
import SidebarSection from './SidebarSection';
import NavItem from './NavItem';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


const MAIN_NAV_ITEMS = [
  { viewKey: 'explorer', label: 'Explorer', icon: <LayoutGrid size={18} /> },
  { viewKey: 'radio', label: 'Radio', icon: <Radio size={18} /> },
  { viewKey: 'songs', label: 'Songs', icon: <Music size={18} /> },
  { viewKey: 'artists', label: 'Artists', icon: <Mic2 size={18} /> },
  { viewKey: 'albums', label: 'Albums', icon: <Disc size={18} /> },
  { viewKey: 'playlists', label: 'Playlists', icon: <ListMusic size={18} /> },
  { viewKey: 'favorite', label: 'Favorite', icon: <Heart size={18} /> },
];

const SETTINGS_NAV_ITEMS = [
  { viewKey: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  { viewKey: 'equalizer', label: 'Equalizer', icon: <SlidersHorizontal size={18} /> },
];



function Sidebar({ activeView, onNavigate, user, nowPlaying }) {
  const { logout } = useAuth();
  return (
    <div className="sidebar">
      <Brand />

      <UserProfile name={user?.name} avatarUrl={user?.avatarUrl} />

      <SidebarSection title="Menu">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.viewKey}
            viewKey={item.viewKey}
            label={item.label}
            icon={item.icon}
            activeView={activeView}
            onNavigate={onNavigate}
          />
        ))}
      </SidebarSection>

      <SidebarSection>
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.viewKey}
            viewKey={item.viewKey}
            label={item.label}
            icon={item.icon}
            activeView={activeView}
            onNavigate={onNavigate}
          />
        ))}
      </SidebarSection>
      
<button className="nav-item" onClick={logout}>
  <span className="nav-item__icon"><LogOut size={18} /></span>
  <span className="nav-item__label">Log out</span>
</button>
      <div className="sidebar__spacer" />
    </div>
  );
}

export default Sidebar;