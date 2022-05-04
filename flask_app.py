import enum
from models.experimental import attempt_load
from utils.torch_utils import select_device
from PIL import Image
import base64
import io
from flask import Flask, request, jsonify
import json
import numpy as np
from backend.predict import predict
from pathlib import Path

# 传入__name__实例化Flask
app = Flask(__name__)

# 读取flask配置
with open('./backend/flask_config.json','r',encoding='utf8')as fp:
    opt = json.load(fp)
    print('Flask Config : ', opt)

# 选择设备
device = select_device(opt['device'])
# 加载模型
model = attempt_load(opt['weights'], map_location=device)  

@app.route('/predict/', methods=['POST'])
# 响应POST消息的预测函数
def get_prediction():
    response = request.get_json()
    data_str = response['image']
    point = data_str.find(',')
    base64_str = data_str[point:]  # remove unused part like this: "data:image/jpeg;base64,"
    image = base64.b64decode(base64_str) # base64图像解码
    img = Image.open(io.BytesIO(image)) # 打开文件
    if (img.mode != 'RGB'):
        img = img.convert("RGB")
    save_path = str(Path(opt['source']) / Path("img4predict.jpg")) # 保存路径
    img.save(save_path) # 保存文件
    # img.save("./frontend/static/images/img4predict.jpg")  

    # convert to numpy array.
    img_arr = np.array(img)
    # print('img_arr shape = %s \n' % str(img_arr.shape))

    results = predict(opt, model, img_arr) # 预测图像
    """
    results检测出来了，就调用“调查问卷”函数，同时返回results在前端进行截图，后端只需要class_results和前端截图结果一一对应即可。
    若results没有检测出来，就直接返回results，不调用“调查问卷”函数。
    """

    #我不确定这么写可不可以保证为空能进入这个if   5月4更新，好像只需要第一个
    if results is None or len(results['results']) or results['results'] is None:
        return  jsonify(results)
    
    #在这里调用调查问卷函数  参数：class_results
    for whichclass in results['class_results'] :

    #测试
    return jsonify(results)

@app.after_request
def add_headers(response):
    # 允许跨域
    response.headers.add('Access-Control-Allow-Origin', '*') 
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1')
    #app.run(debug=False, host='127.0.0.1')



