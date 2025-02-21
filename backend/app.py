from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# 加载环境变量
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')  # 用于JWT

# 配置 CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 120
    }
})

# 预检请求处理
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# 数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///timer.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    records = db.relationship('Record', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# 定义记录模型
class Record(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
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

# JWT认证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        print(f"Received token: {token}")  # 调试信息
        if not token:
            return jsonify({'message': '缺少认证令牌'}), 401
        try:
            token = token.split(' ')[1]  # Bearer token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            print(f"Decoded data: {data}")  # 调试信息
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': '用户不存在'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': '无效的令牌'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# 创建数据库表
with app.app_context():
    db.create_all()

# API路由
@app.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    records = Record.query.filter_by(user_id=current_user.id).all()
    
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
@token_required
def get_records(current_user):
    records = Record.query.filter_by(user_id=current_user.id).order_by(Record.start_time.desc()).all()
    return jsonify([record.to_dict() for record in records])

@app.route('/records', methods=['POST'])
@token_required
def create_record(current_user):
    data = request.json
    
    try:
        # 解析 ISO 格式的时间字符串
        start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        duration = data['duration']

        record = Record(
            user_id=current_user.id,
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
@token_required
def delete_record(current_user, record_id):
    record = Record.query.filter_by(id=record_id, user_id=current_user.id).first()
    
    if record is None:
        return jsonify({'error': '记录不存在'}), 404
        
    try:
        db.session.delete(record)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# 用户注册
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'message': '缺少必要字段'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已被注册'}), 400

    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # 生成 JWT
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'message': '注册成功',
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '注册失败', 'error': str(e)}), 500

# 用户登录
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    print("登录请求数据:", data)  # 调试日志
    
    if not data or not data.get('username') or not data.get('password'):
        print("缺少用户名或密码")  # 调试日志
        return jsonify({'message': '缺少用户名或密码'}), 400

    user = User.query.filter_by(username=data['username']).first()
    print("查询到的用户:", user.username if user else None)  # 调试日志
    
    if not user or not user.check_password(data['password']):
        print("密码验证失败" if user else "用户不存在")  # 调试日志
        return jsonify({'message': '用户名或密码错误'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    print("登录成功，生成token")  # 调试日志
    return jsonify({
        'message': '登录成功',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200

# 获取用户信息
@app.route('/auth/user', methods=['GET'])
@token_required
def get_user_info(current_user):
    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }
    }), 200

# 更新个人信息
@app.route('/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    
    if not data:
        return jsonify({'message': '没有提供更新数据'}), 400
        
    # 检查用户名是否已存在
    if 'username' in data and data['username'] != current_user.username:
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'message': '用户名已存在'}), 400
            
    # 检查邮箱是否已存在
    if 'email' in data and data['email'] != current_user.email:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': '邮箱已存在'}), 400
    
    # 更新用户信息
    if 'username' in data:
        current_user.username = data['username']
    if 'email' in data:
        current_user.email = data['email']
        
    try:
        db.session.commit()
        return jsonify({
            'message': '个人信息更新成功',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '更新失败'}), 500

# 修改密码
@app.route('/auth/password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.json
    
    if not data or not data.get('oldPassword') or not data.get('newPassword'):
        return jsonify({'message': '请提供当前密码和新密码'}), 400
        
    if not current_user.check_password(data['oldPassword']):
        return jsonify({'message': '当前密码错误'}), 400
        
    current_user.set_password(data['newPassword'])
    
    try:
        db.session.commit()
        return jsonify({'message': '密码修改成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '密码修改失败'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
