import localforage from 'localforage';

interface Record {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
}

const STORAGE_KEY = 'timer_records';
const API_BASE_URL = 'http://localhost:5000';  // 后端服务端口
const USER_ID = 'default';

// API 请求配置
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' as RequestCredentials
};

// 初始化 localforage
localforage.config({
  name: 'Timer App',
  storeName: 'records',
});

// 检查 API 是否可用
const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats?user_id=${USER_ID}`, fetchConfig);
    return response.ok;
  } catch (error) {
    console.error('API 连接失败:', error);
    return false;
  }
};

// 保存记录
export const saveRecord = async (record: Omit<Record, 'id'>) => {
  try {
    // 保存到本地
    const records = await getRecords();
    const newRecord = {
      ...record,
      id: Date.now().toString(),
    };
    records.push(newRecord);
    await localforage.setItem(STORAGE_KEY, records);

    // 检查 API 可用性并同步到服务器
    if (await checkApiAvailability()) {
      try {
        const response = await fetch(`${API_BASE_URL}/records`, {
          method: 'POST',
          ...fetchConfig,
          body: JSON.stringify({
            ...record,
            user_id: USER_ID,
          }),
        });
        
        if (!response.ok) {
          console.warn('同步记录到服务器失败:', await response.text());
        }
      } catch (error) {
        console.warn('同步到服务器失败:', error);
      }
    }

    return newRecord;
  } catch (error) {
    console.error('保存记录失败:', error);
    throw error;
  }
};

// 获取所有记录
export const getRecords = async (): Promise<Record[]> => {
  try {
    // 检查 API 可用性
    if (await checkApiAvailability()) {
      try {
        const response = await fetch(`${API_BASE_URL}/records?user_id=${USER_ID}`, fetchConfig);
        if (response.ok) {
          const serverRecords = await response.json();
          await localforage.setItem(STORAGE_KEY, serverRecords);
          return serverRecords;
        } else {
          console.warn('从服务器获取记录失败:', await response.text());
        }
      } catch (error) {
        console.warn('从服务器获取记录失败:', error);
      }
    }

    // 使用本地数据
    const records = await localforage.getItem<Record[]>(STORAGE_KEY);
    return records || [];
  } catch (error) {
    console.error('获取记录失败:', error);
    return [];
  }
};

// 删除记录
export const deleteRecord = async (id: string) => {
  try {
    // 从本地删除
    const records = await getRecords();
    const updatedRecords = records.filter(record => record.id !== id);
    await localforage.setItem(STORAGE_KEY, updatedRecords);

    // 检查 API 可用性并从服务器删除
    if (await checkApiAvailability()) {
      try {
        const response = await fetch(`${API_BASE_URL}/records/${id}?user_id=${USER_ID}`, {
          method: 'DELETE',
          ...fetchConfig
        });
        
        if (!response.ok) {
          console.warn('从服务器删除记录失败:', await response.text());
        }
      } catch (error) {
        console.warn('同步删除操作到服务器失败:', error);
      }
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    throw error;
  }
};

// 获取统计数据
export const getStats = async () => {
  try {
    // 检查 API 可用性
    if (await checkApiAvailability()) {
      try {
        const response = await fetch(`${API_BASE_URL}/stats?user_id=${USER_ID}`, fetchConfig);
        if (response.ok) {
          return await response.json();
        } else {
          console.warn('从服务器获取统计数据失败:', await response.text());
          throw new Error('获取统计数据失败');
        }
      } catch (error) {
        console.warn('从服务器获取统计数据失败:', error);
        throw error;
      }
    }
    
    // 如果 API 不可用，计算本地数据的统计信息
    console.info('使用本地数据计算统计信息');
    const records = await getRecords();
    const totalCount = records.length;
    const totalDuration = records.reduce((sum, record) => sum + record.duration, 0);
    const averageDuration = totalCount > 0 ? Math.round(totalDuration / totalCount) : 0;
    
    // 计算最近 7 天的数据
    const dailyCounts: { [key: string]: number } = {};
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailyCounts[date.toISOString().split('T')[0]] = 0;
    }

    records.forEach(record => {
      const date = record.startTime.split(' ')[0];
      if (dailyCounts.hasOwnProperty(date)) {
        dailyCounts[date]++;
      }
    });
    
    return {
      totalCount,
      totalDuration,
      averageDuration,
      dailyCounts
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    throw error;
  }
};
