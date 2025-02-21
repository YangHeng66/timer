from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)

# 配置 CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 120  # 预检请求缓存2分钟
    }
})

# 预检请求处理
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# 数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///timer.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 禁用调试模式重载器
app.config['DEBUG'] = False
app.config['USE_RELOADER'] = False

db = SQLAlchemy(app)

# 定义记录模型
class Record(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)  # 用于未来多用户支持
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # 持续时间（秒）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'startTime': self.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            'endTime': self.end_time.strftime('%Y-%m-%d %H:%M:%S'),
            'duration': self.duration,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

# 创建数据库表
with app.app_context():
    db.create_all()

# API路由
@app.route('/stats', methods=['GET'])
def get_stats():
    user_id = request.args.get('user_id', 'default')
    records = Record.query.filter_by(user_id=user_id).all()
    
    total_count = len(records)
    total_duration = sum(record.duration for record in records)
    avg_duration = total_duration // total_count if total_count > 0 else 0
    
    # 计算最近7天的数据
    from datetime import timedelta
    today = datetime.utcnow().date()
    daily_counts = {(today - timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(7)}
    
    for record in records:
        record_date = record.start_time.date()
        if (today - record_date).days < 7:
            daily_counts[record_date.strftime('%Y-%m-%d')] += 1
    
    return jsonify({
        'totalCount': total_count,
        'totalDuration': total_duration,
        'averageDuration': avg_duration,
        'dailyCounts': daily_counts
    })

@app.route('/records', methods=['GET'])
def get_records():
    user_id = request.args.get('user_id', 'default')
    records = Record.query.filter_by(user_id=user_id).order_by(Record.start_time.desc()).all()
    return jsonify([record.to_dict() for record in records])

@app.route('/records', methods=['POST'])
def create_record():
    data = request.json
    user_id = data.get('user_id', 'default')
    
    try:
        # 解析 ISO 格式的时间字符串
        start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        duration = data['duration']

        record = Record(
            user_id=user_id,
            start_time=start_time,
            end_time=end_time,
            duration=duration
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify(record.to_dict()), 201
    except Exception as e:
        app.logger.error(f"Error creating record: {str(e)}")
        app.logger.error(f"Request data: {data}")
        return jsonify({'error': str(e)}), 400

@app.route('/records/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    user_id = request.args.get('user_id', 'default')
    record = Record.query.filter_by(id=record_id, user_id=user_id).first()
    
    if record is None:
        return jsonify({'error': '记录不存在'}), 404
        
    try:
        db.session.delete(record)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
