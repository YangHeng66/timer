import React, { useState, useEffect } from 'react';
import { Button } from 'antd-mobile';
import { saveRecord } from '../utils/storage';
import '../styles/global.css';

const Timer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      intervalId = window.setInterval(() => {
        setTime(prev => prev + 10); // 每10毫秒更新一次
      }, 10);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (startTime) {
      const endTime = new Date();
      await saveRecord({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: Math.floor(time / 1000) // 转换为秒
      });
    }
    setTime(0);
    setStartTime(null);
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card timer-card">
      <div className="header">
        <h1 className="title">专注计时器</h1>
        <p className="subtitle">记录每一个重要时刻</p>
      </div>
      <div className="timer-display">
        <span className="time">{formatTime(time)}</span>
      </div>
      <div className="timer-controls">
        {!isRunning ? (
          <Button 
            className="button start-button"
            onClick={handleStart}
          >
            开始
          </Button>
        ) : (
          <Button 
            className="button stop-button"
            onClick={handleStop}
          >
            停止
          </Button>
        )}
      </div>
    </div>
  );
};

export default Timer;
