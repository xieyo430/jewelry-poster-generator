"""
rembg抠图服务
监听5000端口，接收图片并返回去背景后的透明PNG
"""
from flask import Flask, request, send_file, jsonify
from rembg import remove
from PIL import Image
import io
import sys

app = Flask(__name__)

# 预热模型
print("正在加载抠图模型...", flush=True)
try:
    # 用一张小图触发模型加载
    warmup = Image.new('RGB', (64, 64))
    remove(warmup)
    print("模型加载完成!", flush=True)
except Exception as e:
    print(f"模型预热失败: {e}", flush=True)


@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    """接收图片，返回去背景后的透明PNG"""
    if 'image' not in request.files:
        return jsonify({'error': '未上传图片'}), 400

    file = request.files['image']
    if not file.filename:
        return jsonify({'error': '文件名为空'}), 400

    try:
        input_image = Image.open(file.stream)
        output_image = remove(input_image)

        buf = io.BytesIO()
        output_image.save(buf, format='PNG')
        buf.seek(0)
        return send_file(buf, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': f'抠图失败: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'service': 'rembg'})


if __name__ == '__main__':
    print("rembg抠图服务启动: http://localhost:5000", flush=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
