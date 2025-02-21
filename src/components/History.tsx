import React, { useState, useEffect } from 'react';
import { List, SwipeAction, Dialog, Empty } from 'antd-mobile';
import { getRecords, deleteRecord } from '../utils/storage';
import './History.css';

interface Record {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
}

const History: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getRecords();
    setRecords(data.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ));
  };

  const handleDelete = async (id: string) => {
    const result = await Dialog.confirm({
      content: '确定要删除这条记录吗？',
    });

    if (result) {
      await deleteRecord(id);
      await loadRecords();
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (records.length === 0) {
    return (
      <div className="history-empty">
        <Empty description="暂无记录" />
      </div>
    );
  }

  return (
    <div className="history">
      <List>
        {records.map(record => (
          <SwipeAction
            key={record.id}
            rightActions={[
              {
                key: 'delete',
                text: '删除',
                color: 'danger',
                onClick: () => handleDelete(record.id),
              },
            ]}
          >
            <List.Item
              title={record.startTime}
              description={`持续时间: ${formatDuration(record.duration)}`}
              arrow={false}
            />
          </SwipeAction>
        ))}
      </List>
    </div>
  );
};

export default History;
