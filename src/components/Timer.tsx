import React, { useState, useEffect, useRef } from 'react';
import { Button, Toast } from 'antd-mobile';
import { PlayOutline, StopOutline, DownlandOutline, UploadOutline } from 'antd-mobile-icons';
import { saveRecord } from '../utils/storage';
import { getStats } from '../utils/storage';
import './Timer.css';

interface TimerStats {
  totalCount: number;
  averageDuration: number;
  weeklyCount: number;
  monthlyCount: number;
}

const Timer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stats, setStats] = useState<TimerStats>({
    totalCount: 0,
    averageDuration: 0,
    weeklyCount: 0,
    monthlyCount: 0
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadStats();
    initCamera();
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      // 清理摄像头
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRunning]);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats({
        totalCount: data.totalCount || 0,
        averageDuration: data.averageDuration || 0,
        weeklyCount: data.weeklyCount || 0,
        monthlyCount: data.monthlyCount || 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('摄像头初始化失败:', err);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handleStop = async () => {
    if (!startTime) return;

    setIsRunning(false);
    const endTime = new Date();
    
    try {
      await saveRecord({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: time
      });
      
      Toast.show({
        content: '记录已保存',
        icon: 'success',
      });
      
      setTime(0);
      setStartTime(null);
      loadStats();
    } catch (error: any) {
      Toast.show({
        content: error.message || '保存失败',
        icon: 'fail',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/records/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('导出失败');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timer_records_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      Toast.show({
        content: '导出成功',
        icon: 'success',
      });
    } catch (error: any) {
      Toast.show({
        content: error.message || '导出失败',
        icon: 'fail',
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/records/import', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('导入失败');

        Toast.show({
          content: '导入成功',
          icon: 'success',
        });
        loadStats();
      } catch (error: any) {
        Toast.show({
          content: error.message || '导入失败',
          icon: 'fail',
        });
      }
    };
    input.click();
  };

  return (
    <div className="timer-container">
      <div className="card timer-card">
        <div className="header">
          <h1 className="title">打飞机计时器</h1>
          <p className="subtitle">记录每一个重要时刻</p>
        </div>
        <div className="timer-display">
          <span className="time">{formatTime(time)}</span>
        </div>
        <div className="timer-controls">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
            />
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="control-button start glass-button"
                shape="rounded"
                size="large"
              >
                开始
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                className="control-button stop"
                shape="rounded"
                size="large"
              >
                结束
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-container">
        <h2 className="stats-title">统计数据</h2>
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-value">{stats.totalCount}</div>
            <div className="stats-label">总次数</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">{Math.round(stats.averageDuration / 60)}</div>
            <div className="stats-label">平均时长(分钟)</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">{stats.weeklyCount}</div>
            <div className="stats-label">本周次数</div>
          </div>
          <div className="stats-card">
            <div className="stats-value">{stats.monthlyCount}</div>
            <div className="stats-label">本月次数</div>
          </div>
        </div>
        <div className="data-controls">
          <Button
            onClick={handleExport}
            className="data-button"
            shape="rounded"
            size="small"
          >
            <DownlandOutline fontSize={18} />
            导出数据
          </Button>
          <Button
            onClick={handleImport}
            className="data-button"
            shape="rounded"
            size="small"
          >
            <UploadOutline fontSize={18} />
            导入数据
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
