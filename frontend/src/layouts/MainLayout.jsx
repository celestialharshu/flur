import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import Queue from '../components/Queue/Queue';
import PlayerBar from '../components/Player/PlayerBar';

function MainLayout({ activeView, onNavigate, children, user, onSearch, onClearSearch }) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar activeView={activeView} onNavigate={onNavigate} user={user} />
      </aside>

      <main className="app-shell__main">
        <Header onSearch={onSearch} onClearSearch={onClearSearch} />
        {children}
      </main>

      <aside className="app-shell__queue">
        <Queue />
      </aside>

      <footer className="app-shell__player">
        <PlayerBar />
      </footer>
    </div>
  );
}

export default MainLayout;
