import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { ClockCircleOutline, HistogramOutline, UnorderedListOutline } from 'antd-mobile-icons';
import Timer from './components/Timer';
import History from './components/History';
import Stats from './components/Stats';
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
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Timer />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
        <div className="bottom-nav">
          <Navigation />
        </div>
      </div>
    </Router>
  );
};

export default App;
