import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { ClockCircleOutline, HistogramOutline, UnorderedListOutline, UserOutline } from 'antd-mobile-icons';
import Timer from './components/Timer';
import History from './components/History';
import Stats from './components/Stats';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { getToken, setToken, getCurrentUser } from './utils/auth';
import { User } from './types/user';
import './styles/global.css';

// 导航组件
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      key: '/',
      title: '计时',
      icon: <ClockCircleOutline />,
    },
    {
      key: '/history',
      title: '历史',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/stats',
      title: '统计',
      icon: <HistogramOutline />,
    },
    {
      key: '/profile',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  return (
    <TabBar activeKey={location.pathname} onChange={value => navigate(value)}>
      {tabs.map(tab => (
        <TabBar.Item
          key={tab.key}
          icon={tab.icon}
          title={tab.title}
        />
      ))}
    </TabBar>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = getToken();
    if (token) {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (error) {
        console.error('验证失败:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuthSuccess = (token: string) => {
    setToken(token);
    checkAuth();
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={user ? <Timer /> : <Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/history" element={user ? <History /> : <Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/stats" element={user ? <Stats /> : <Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/profile" element={user ? <Profile user={user} onProfileUpdate={handleProfileUpdate} /> : <Auth onAuthSuccess={handleAuthSuccess} />} />
        </Routes>
        {user && (
          <div className="bottom-nav">
            <Navigation />
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
