import enum
from os import TMP_MAX
from tkinter.messagebox import QUESTION
from turtle import distance
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
import math
from copy import deepcopy

from common import mysql_operate  # 从common包中导入mysql_operate，使用其db

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
    if results is None:
        #print("None return---------") 
        return  jsonify(results)
    
    #在这里实现调查问卷
    #每个问题给个编号，直接用编号做交互
    #要维护一个这个病人的疾病表,一行就是一个矩形框
    disease_table = []
    question_table = []
    switch = {'melanoma':0, 'nevus':1, 'acne':2, 'urticaria':3, 'tinea_corporis':4, 'corn':5, 'vitiligo':6}
    for whichrectangle in results['class_results'] : #classs_results中的一行为一个矩形框的病变内容
        class_vector = [.0 for dghjfghf in range(7)] #class_vector存储一个矩形框的各种病的置信度
        question_vector = []
        for whichclass in whichrectangle : 
            #把各个类的置信度拿出来存进去
            class_vector[switch[whichclass['name']]] = whichclass['conf']
            #把各个类对应的问题拿出来存进去
            sql = "SELECT id, questionContent FROM Question WHERE disease = '" + str(switch[whichclass['name']] + 1) + "'"
            #print("SQL-----------")
            #print(mysql_operate.db.select_db(sql))
            question_vector.append(mysql_operate.db.select_db(sql))
            # question_vector.append((1,'aaa'))#数据库操作

        #各vector按顺序对应各矩形框，直接append进去即可   
        disease_table.append(class_vector)
        question_table.append(question_vector)
    del switch

    #字典类型添加元素的方法如下
    results['disease_table'] = disease_table
    results['question_table'] = question_table
    
    #results['disease_table'] = disease_table
    #测试
    #results只负责画框，剩下的结果都在class_results里
    return jsonify(results)


@app.route('/quesback/', methods=['POST'])
def get_ans():
    response = request.get_json()
    data_ans = response['ans']
    data_dis = list(map( lambda x:list(map(lambda y:float(y), x)), response['disease'] ))
    #print(data_ans)
    #print(data_dis)
    print("---------------------------")
    origin_data_dis = data_dis
    print(data_dis)
    for ans in data_ans:
        # if ans.find('P') == -1:#P不做改变
        if not ans.__contains__('P'):
            if ans.__contains__('Y'):
                sql = "SELECT disease, weightsUp as w FROM Question WHERE id = " + ans[ans.find('Q')+1 : ans.find('Y')] 
            elif ans.__contains__('N'): 
                sql = "SELECT disease, weightsDown as w FROM Question WHERE id = " + ans[ans.find('Q')+1 : ans.find('N')]
            tmp = mysql_operate.db.select_db(sql)[0]
            #data_dis[int(ans[0])][tmp['disease']-1] *= (tmp['w'] * 0.01)
            #考虑函数y = 2/pi(arctanx)和y = 1-exp（-x）,作为权重修改的模型
            tmpX = - math.log(1 - data_dis[int(ans[0])][tmp['disease']-1])
            tmpX += tmp['w'] * 0.01
            data_dis[int(ans[0])][tmp['disease']-1] = 1 - math.exp(-tmpX)

    #截断最大值为1,截断最小值为0     
    data_dis = list(map( lambda x:list(map(lambda y:max(min(y,1.0),0.0), x)), data_dis))   
    ans = {"origin":origin_data_dis,"dis":data_dis}
    sug = []
    for eachdis in data_dis:
        tmpArr = deepcopy(eachdis)
        tmpArr.sort()

        tmpdis1 = eachdis.index(tmpArr[-1])
        tmpdis2 = eachdis.index(tmpArr[-2])
        tmpdis3 = eachdis.index(tmpArr[-3])
        sql = "SELECT diseaseName as n, diseaseSuggestions as s FROM Suggestions WHERE disease = " + str(tmpdis1 + 1)
        dis1 = mysql_operate.db.select_db(sql)[0]
        sug.append({"dis1": dis1})

        if eachdis[tmpdis1] - eachdis[tmpdis2] <= 0.40 and eachdis[tmpdis2] != 0.0:
            print("111")
            sql = "SELECT diseaseName as n, diseaseSuggestions as s FROM Suggestions WHERE disease = " + str(tmpdis2 + 1)
            dis2 = mysql_operate.db.select_db(sql)[0]
            sug[-1]['dis2'] = dis2
        if eachdis[tmpdis2] - eachdis[tmpdis3] <= 0.25 and eachdis[tmpdis3] != 0.0:
            print("222")
            sql = "SELECT diseaseName as n, diseaseSuggestions as s FROM Suggestions WHERE disease = " + str(tmpdis3 + 1)
            dis3 = mysql_operate.db.select_db(sql)[0]
            sug[-1]['dis3'] = dis3

    ans['sugesstions'] = sug
    print(data_dis)
    print("---------------------------")
    print("...........................")
    print(ans)
    print("...........................")
    return jsonify(ans)

@app.after_request
def add_headers(response):
    # 允许跨域
    response.headers.add('Access-Control-Allow-Origin', '*') 
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1')
    #app.run(debug=False, host='127.0.0.1')