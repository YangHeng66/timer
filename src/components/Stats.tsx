import React, { useState, useEffect } from 'react';
import { Card } from 'antd-mobile';
import * as echarts from 'echarts';
import { getStats } from '../utils/storage';
import './Stats.css';

interface StatsData {
  totalCount: number;
  averageDuration: number;
  totalDuration: number;
  dailyCounts: { [key: string]: number };
}

const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    totalCount: 0,
    averageDuration: 0,
    totalDuration: 0,
    dailyCounts: {},
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('开始加载统计数据...');
      const statsData = await getStats();
      console.log('获取到统计数据:', statsData);
      setStats(statsData);
      initChart(statsData.dailyCounts);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const initChart = (dailyCounts: { [key: string]: number }) => {
    const chartDom = document.getElementById('statsChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    const days = getLast7Days();
    const data = days.map(day => dailyCounts[day] || 0);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1
      },
      series: [{
        data,
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)'
        }
      }]
    };

    myChart.setOption(option);

    // 响应式调整
    window.addEventListener('resize', () => {
      myChart.resize();
    });

    return () => {
      window.removeEventListener('resize', () => {
        myChart.resize();
      });
      myChart.dispose();
    };
  };

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="stats">
      <div className="stats-cards">
        <Card className="stat-card">
          <div className="stat-title">总次数</div>
          <div className="stat-value">{stats.totalCount}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-title">平均时长</div>
          <div className="stat-value">{formatDuration(stats.averageDuration)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-title">总时长</div>
          <div className="stat-value">{formatDuration(stats.totalDuration)}</div>
        </Card>
      </div>
      <Card className="chart-card">
        <div className="chart-title">最近7天趋势</div>
        <div id="statsChart" className="stats-chart"></div>
      </Card>
    </div>
  );
};

export default Stats;
