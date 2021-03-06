var form,layer;
layui.use(['form','layer'], function () {
  form = layui.form;
  layer = layui.layer;
});

// var elemlayui;
// layui.use('element', function () {
//   elemlayui = layui.element;
// });

const image = document.getElementById('image');
const canvas = document.getElementById('canvas');
const warning = document.getElementById('warning');
const fileInput = document.getElementById('fileUploader');
const myout = document.getElementById('myout');
const image1 = new Image();

// const URL = "http://localhost:5000/predict/"
// const URL = "http://192.168.16.121:5000/predict/"

var firstFlag = 0;
// 获取服务器端URL 
function GetUrl() {
  var protocol = window.location.protocol.toString();
  // var host =  window.location.host.toString();
  var host = document.domain.toString();
  var port = window.location.port.toString();
  var url = protocol + '//' + host + ":5000/predict/";
  console.log(123123);
  //判断电脑或手机
  if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
    //手机
    //#号是根据id找element
    $('#text-container').width("90%");
    $('#text-container1').width("90%");
    //$('#pcbutton').display("none");
    document.getElementById("pcbutton").style.display = "none";
    var htmlA = '<div id="pcbutton" class="layui-form-item">' +
      '<br>' +
      '<div style="color: white;">' +
      '您正在使用手机端，请：<br>' +
      '<div class="layui-inline">' +
      '<div class="layui-inline">' +
      '<input type="file" accept="image/*" class="border-color: rgba(255,255,255,.2);layui-btn layui-btn-primary" style="text-align: center;color: white;" capture="camera" id="picFile" onchange="readPhone(this)" / >' +
      '</div>' +
      // '或&nbsp; &nbsp;' +
      // '<div class="layui-inline">' +
      // '<button type="button" class="layui-btn layui-btn-primary" style="color: white;" onClick="clickUploader()">上传图片</button>' +
      // '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<br>'
    document.getElementById("camera").innerHTML = htmlA;
    //elemlayui.progress('demo', '20%');
  } else {
    console.log();
    // document.getElementById('text-container').style.width;

    // console.log(document.getElementById('text-container1').style.width);
    //document.getElementsByName('contan2').style.width = 70 + "%";
    console.log("这是电脑");  //电脑
    //elemlayui.progress('demo', '20%');
  }

  return url;
}

function readPhone(obj) {
  firstFlag = 1;
  var file = obj.files[0];
  //判断类型是不是图片  不难发现这个检测是基于正则表达式的，因此可以进行各种复杂的匹配，非常有用。
  if (!/image\/\w+/.test(file.type)) {
    alert("请确保文件为图像类型");
    return false;
  }
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function (e) {
    let img = new Image();
    img.src = e.target.result;
    image.src = this.result;
    img.onload = function () {
      console.log('height:' + this.height + '----width:' + this.width)
      realHeight = this.height;
      realWidth = this.width;
    }
  }
  reader.onloadend = () => {
    image.src = reader.result;
    // send the img to server
    communicate(reader.result);
  }

}


const URL = GetUrl()
// alert(URL);

// 取消事件默认动作和传播
function preventDefaults(e) {
  e.preventDefault() //取消事件的默认动作
  e.stopPropagation() //停止事件的传播，阻止它被分派到其他Document节点。
};
var gloResult;
var gloQuestion;
// 发送图片到服务器, 接收检测结果,就是后端传过来的box，并在canvas上绘图 
function communicate(img_base64_url) {
  //使用AJAX
  $.ajax({
    url: URL,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ "image": img_base64_url }), //使用base64编码
    dataType: "json"
  }).done(function (response_data) {
    //console.log(response_data);
    if (response_data == null && firstFlag == 1) {
      // alert("此图片未识别出病变部位，请调整拍摄角度以及灯光")
      alert("此图片未识别出病变部位，请调整拍摄角度以及灯光")
      document.getElementById("sendMsgBut").style.display = "none";
      document.getElementById("text-container3").style.display = "";
      console.log("111111111111")
      if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
   console.log("111111111111")
      document.getElementById("text-container3").innerHTML = '<div class="layui-elem-quote" style="font-size:medium;"><p>此图片未识别出病变部位，请调整拍摄角度以及灯光</p></div>';
      document.getElementById("myout").style.display = "none";
      document.getElementById("canvas").style.display = "none";
      }
      // $('#text-container1').val("此图片未识别出病变部位，请调整拍摄角度以及灯光");
      //elemlayui.progress('demo', '20%');
    }
    else {
      //alert(response_data.class_results[1]['name'])
      // $('#text-container1').val("");
      document.getElementById("text-container3").style.display = "none";
      console.log(response_data.class_results)//可以把标准框附件的类输出出来
      console.log(response_data.disease_table)
      console.log(response_data.question_table)
      var tmpResult = response_data.results;
      for (bboxInfo of tmpResult) {
        var w = image.width / realWidth;
        var h = image.height / realHeight;
        bboxInfo['bbox'][0] = bboxInfo['bbox'][0] * w;
        bboxInfo['bbox'][2] = bboxInfo['bbox'][2] * w;
        bboxInfo['bbox'][1] = bboxInfo['bbox'][1] * h;
        bboxInfo['bbox'][3] = bboxInfo['bbox'][3] * h;
      }
      gloResult = tmpResult;
      gloQuestion = response_data.question_table;
      drawResult(tmpResult);
      output(response_data.question_table, tmpResult);
      qt_global = response_data.question_table;
      dt_global = response_data.disease_table;
      //elemlayui.progress('demo', '66%');
    }
  });
}


var qt_global;
var dt_global;
function sendMsg() {
  //题目数
  var singleSize = $("[name='single']").length;
  //答案数组
  var answerArr = new Array(singleSize);
  //单选答案


  $("[name='single']").each(function (index) {
    var answer = "zxc"
    $(this).find("input").each(function (s) {
      var aname = $(this).attr("name")
      console.log(aname);
      answerArr[index] = $("input[name='" + aname + "']:checked").val();
    })
  })
  //queIndex += 1;
  //在调试模式下的console中查看输出
  console.log(answerArr);
  //发送答案到服务器
  var protocol = window.location.protocol.toString();
  var host = document.domain.toString();
  var quesURL = protocol + '//' + host + ":5000/quesback/";
  //elemlayui.progress('demo', '66.6%');
  //传问卷和接结果的
  $.ajax({
    url: quesURL,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ "ans": answerArr, "disease": dt_global }), //使用base64编码
    dataType: "json"
  }).done(function (response_data) {
    //console.log(response_data);
    if (response_data == null) {
      alert("问卷内容出错，请重新填写")
    }
    else {
      showSuggestions(response_data.origin, response_data.dis, response_data.suggestions, gloResult, gloQuestion)
    }
  });
}

//显示结果
function showSuggestions(origin, dis, suggestions, results, question_table) {
  // document.getElementById('video').style.display = "none";
  // canvas.style.display = "";
  // myout.style.display = "";
  // document.getElementById('image').style.display = "";
  //innerHTML应该可以塞进去，但是按道理来说塞不进去
  //elemlayui.progress('demo', '100%');
  document.getElementById("sendMsgBut").style.display = "none";
  var rectIndex = 0;
  var html = '';
  html += '<form>';
  console.log(suggestions);
  console.log(results);
  for (sugges of suggestions) {
    //把这个框的截图输出
    console.log(sugges);
    bbox = results[rectIndex]['bbox'];
    width = bbox[2] - bbox[0];
    height = bbox[3] - bbox[1];
    cutImg(bbox[0], bbox[1], width, height, image.height, image.width);
    html += '<div class=\"layui-panel\">' + '<div style=\"padding: 50px 30px;\">'
    html += "<img src=\"" + image1.src + "\" />"
    if (dis[rectIndex][0] <= 0.05 && dis[rectIndex][1] <= 0.05 && dis[rectIndex][2] <= 0.05 && dis[rectIndex][3] <= 0.05 && dis[rectIndex][4] <= 0.05 && dis[rectIndex][5] <= 0.05 && dis[rectIndex][6] <= 0.05) {
      html += '<div class="layui-tab layui-tab-brief" lay-filter="docDemoTabBrief">' +
        '<ul class="layui-tab-title">' +
        '<li class="layui-this">诊断结果与建议</li>' +
        '<li>诊断详情</li>' +
        '</ul>' +
        '<div class="layui-tab-content" style="">' +
        '<div class="layui-tab-item layui-show">图片序号：' + (rectIndex + 1) + '<br>综合诊断结果为：' + sugges['n'] + '<br>治疗建议：' + sugges['s'] + '<br><br><div style="color:red;font-size:medium">注：该结果综合诊断分数过低（<0.05），可能存在误诊，请患者谨慎判断。</div>' + '</div>' +
        '<div class="layui-tab-item">' +
        '各疾病综合诊断分数（0到1，分数越高属于该病的可能性越大）：<br>' +
        '<div style="overflow-x:auto">' +
        '<table class="layui-table" lay-skin="line"><colgroup><col width="20%"><col width="40%"><col width="40%"><col></colgroup><thead>' +
        '<tr>' +
        '<th>疾病种类</th>' +
        '<th>图像诊断分数</th>' +
        '<th>综合诊断分数</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr>' +
        '<td>黑色素瘤</td>' +
        '<td>' + origin[rectIndex][0] + '</td>' +
        '<td>' + dis[rectIndex][0] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>黑色素痣</td>' +
        '<td>' + origin[rectIndex][1] + '</td>' +
        '<td>' + dis[rectIndex][1] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>痤疮</td>' +
        '<td>' + origin[rectIndex][2] + '</td>' +
        '<td>' + dis[rectIndex][2] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>荨麻疹</td>' +
        '<td>' + origin[rectIndex][3] + '</td>' +
        '<td>' + dis[rectIndex][3] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>体癣</td>' +
        '<td>' + origin[rectIndex][4] + '</td>' +
        '<td>' + dis[rectIndex][4] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>鸡眼</td>' +
        '<td>' + origin[rectIndex][5] + '</td>' +
        '<td>' + dis[rectIndex][5] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>白癜风</td>' +
        '<td>' + origin[rectIndex][6] + '</td>' +
        '<td>' + dis[rectIndex][6] + '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div> '
      rectIndex += 1;
      html += '</div></div > '
    }
    else {
      html += '<div class="layui-tab layui-tab-brief" lay-filter="docDemoTabBrief">' +
        '<ul class="layui-tab-title">' +
        '<li class="layui-this">诊断结果与建议</li>' +
        '<li>诊断详情</li>' +
        '</ul>' +
        '<div class="layui-tab-content" style="">' +
        '<div class="layui-tab-item layui-show">图片序号：' + (rectIndex + 1) + '<br>综合诊断结果为：' + sugges['n'] + '<br>治疗建议：' + sugges['s'] + '</div>' +
        '<div class="layui-tab-item">' +
        '各疾病综合诊断分数（0到1，分数越高属于该病的可能性越大）：<br>' +
        '<div style="overflow-x:auto">' +
        '<table class="layui-table" lay-skin="line"><colgroup><col width="20%"><col width="40%"><col width="40%"><col></colgroup><thead>' +
        '<tr>' +
        '<th>疾病种类</th>' +
        '<th>图像诊断分数</th>' +
        '<th>综合诊断分数</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr>' +
        '<td>黑色素瘤</td>' +
        '<td>' + origin[rectIndex][0] + '</td>' +
        '<td>' + dis[rectIndex][0] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>黑色素痣</td>' +
        '<td>' + origin[rectIndex][1] + '</td>' +
        '<td>' + dis[rectIndex][1] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>痤疮</td>' +
        '<td>' + origin[rectIndex][2] + '</td>' +
        '<td>' + dis[rectIndex][2] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>荨麻疹</td>' +
        '<td>' + origin[rectIndex][3] + '</td>' +
        '<td>' + dis[rectIndex][3] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>体癣</td>' +
        '<td>' + origin[rectIndex][4] + '</td>' +
        '<td>' + dis[rectIndex][4] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>鸡眼</td>' +
        '<td>' + origin[rectIndex][5] + '</td>' +
        '<td>' + dis[rectIndex][5] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>白癜风</td>' +
        '<td>' + origin[rectIndex][6] + '</td>' +
        '<td>' + dis[rectIndex][6] + '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div> '
      rectIndex += 1;
      html += '</div></div > '
    }

  }
  html += '</form>';

  myout.innerHTML = html;
}


let mediaStreamTrack = null; // 视频对象(全局)
let video;
var videoW;
var videoH;
function takePhoto() {
  firstFlag = 1;
  //获得Canvas对象
  let video = document.getElementById('video');
  let canvas1 = document.getElementById('canvas1');
  canvas1.width = image.width;
  canvas1.height = image.height;
  let ctx = canvas1.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas1.width, canvas1.height);
  closeMedia();

  // toDataURL  ---  可传入'image/png'---默认, 'image/jpeg'
  var img = document.getElementById('canvas1').toDataURL();
  // 这里的img就是得到的图片
  console.log('img-----', img);
  document.getElementById('image').src = img;//上传

  $(function () {
    var imgSrc = $("#image").attr("src");
    getImageWidth(imgSrc, function (w, h) {
      console.log({ width: w, height: h });
      realHeight = h;
      realWidth = w;
    });
  });
  // var imagetmp = $("#image");
  // var imageSize = new Image()
  // imageSize.src = imagetmp.attr("src");
  // realHeight = imageSize.height;
  // realWidth = imageSize.width;
  // console.log('height:'+realHeight+'----width:'+realWidth)
  communicate(img);

}

// 获取图片真实高度
function getImageWidth(url, callback) {
  var img = new Image();
  img.src = url;
  // 如果图片被缓存，则直接返回缓存数据
  if (img.complete) {
    callback(img.width, img.height);
  } else {
    img.onload = function () {
      callback(img.width, img.height);
    }
  }
}

//display
function openMedia() {
  //获得video摄像头
  video = document.getElementById('video');
  let constraints = {
    video: { width: image.width, height: image.height },
    audio: false
  };

  let promise = navigator.mediaDevices.getUserMedia(constraints);//html5的标准  可能已经被淘汰,新的api为MediaDevices.getUserMedia
  //elemlayui.progress('demo', '50%');
  // document.getElementById('layuiprogress').innerHTML = '<div id="" class="layui-progress-bar" lay-percent="88%"></div>';
  //let promise = MediaDevices.getVideoTracks
  promise.then((mediaStream) => {
    // mediaStreamTrack = typeof mediaStream.stop === 'function' ? mediaStream : mediaStream.getTracks()[1];
    mediaStreamTrack = mediaStream.getVideoTracks()
    video.srcObject = mediaStream;
    video.play();
    document.getElementById('video').style.display = "";

    canvas.style.display = "none";
    myout.style.display = "none";
    document.getElementById('image').style.display = "none";
    document.getElementById('jcjg').style.display = "none";
    document.getElementById('ystp').style.display = "none";
    document.getElementById('sxtbr').style.display = "";

  });
  //---------------------------------
  // let video = document.getElementById('video');
  // let canvas1 = document.getElementById('canvas1');
  // let ctx = canvas1.getContext('2d');
  // ctx.drawImage(video, 0, 0);
  // var img = document.getElementById('canvas1').toDataURL();
  // document.getElementById('image').src = img;
  // document.getElementById('image').style.display = "none";
}

// 关闭摄像头
//display
function closeMedia() {
  let stream = document.getElementById('video').srcObject;
  let tracks = stream.getTracks();
  tracks.forEach(function (track) {
    track.stop();
  });
  document.getElementById('video').srcObject = null;
  document.getElementById('video').style.display = "none";
  canvas.style.display = "none";
  myout.style.display = "none";
  document.getElementById('image').style.display = "";
  document.getElementById('jcjg').style.display = "none";
  document.getElementById('ystp').style.display = "";
  document.getElementById('sxtbr').style.display = "none";
  //document.getElementById('video').style.display="none";

}

var realHeight;
var realWidth;
// 处理用户上传图片，发送至服务器并绘制检测结果 
function parseFiles(files) {
  const file = files[0];
  const imageType = /image.*/;
  if (file.type.match(imageType)) {
    //warning.innerHTML = '';
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      let img = new Image();
      img.src = e.target.result;//获取编码后的值,也可以用this.result获取
      img.onload = function () {
        console.log('height:' + this.height + '----width:' + this.width)
        realHeight = this.height;
        realWidth = this.width;
      }
    }
    reader.onloadend = () => {

      image.src = reader.result;
      // send the img to server
      communicate(reader.result);

    }
  } else {
    setup();
    warning.innerHTML = 'Please upload an image file.';
  }

}

// 接收到上传文件的回调函数
function handleFiles() {
  parseFiles(fileInput.files);
}

//display
// 上传图片按钮的回调函数
function clickUploader() {
  firstFlag = 1;
  canvas.style.display = "none";
  myout.style.display = "none";
  document.getElementById('video').style.display = "none";
  document.getElementById('image').style.display = "";
  document.getElementById('jcjg').style.display = "none";
  document.getElementById('ystp').style.display = "";
  fileInput.click();

}

// 选择预测框绘制颜色
function selectColor(index) {
  var colors = ["blue", "fuchsia", "green", "lime", "maroon", "navy", "olive", "orange", "purple", "red", "silver", "teal", "white", "yellow", "aqua", "black", "gray"];

  i = index % 18;
  var color = colors[i];
  return color;

}

//display
// 在图片上绘制检测结果
function drawResult(results) {

  canvas.width = image.width;
  canvas.height = image.height;
  ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  var index = 0;
  var tmpindex = 1;
  var totalClasses = new Array();
  for (bboxInfo of results) {
    bbox = bboxInfo['bbox'];
    class_name = bboxInfo['name'];
    score = bboxInfo['conf'];

    ctx.beginPath();
    ctx.lineWidth = "4";

    if (totalClasses.includes(class_name) == false) {
      totalClasses[index] = class_name;
      index += 1;
    }
    //ctx.strokeStyle="red";
    //ctx.fillStyle="red";
    var i = totalClasses.indexOf(class_name)   // class_name 值的索引值
    ctx.strokeStyle = selectColor(i);
    ctx.fillStyle = selectColor(i);

    ctx.rect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
    ctx.stroke();

    ctx.font = "20px Arial";

    //let content = class_name + " " + parseFloat(score).toFixed(2);
    let content = tmpindex;
    tmpindex += 1;
    ctx.fillText(content, bbox[0], bbox[1] < 20 ? bbox[1] + 30 : bbox[1] - 5);
  }
  //画完了才显示出图片，新加的，后面还要隐藏问卷等

  document.getElementById('video').style.display = "none";
  canvas.style.display = "";
  myout.style.display = "";
  document.getElementById('image').style.display = "";
  document.getElementById('jcjg').style.display = "";
  document.getElementById('ystp').style.display = "";
}

//把各框截图和问卷循环写到主页
function output(question_table, results) {
  document.getElementById("sendMsgBut").style.display = "";
  //不能用for in 一定要用for of
  //不能用class作为变量名
  var rectIndex = 0;
  var html = '';
  html += '<br><blockquote class="layui-elem-quote layui-quote-nm" style="font-size:medium;">注：检测结果框中序号对应以下图片中的序号</blockquote>'
  for (var rect of question_table) {
    //var html = '';

    //把这个框的截图输出
    bbox = results[rectIndex]['bbox'];
    width = bbox[2] - bbox[0];
    height = bbox[3] - bbox[1];
    cutImg(bbox[0], bbox[1], width, height, image.height, image.width);
    //console.log(image.height+"**"+image.width);
    html += '<div class=\"layui-panel\">' + '<div style=\"padding: 50px 30px;\">'
    //myout.innerHTML = '<canvas id=\"test' + index + '\"></canvas>'
    html += "<img src=\"" + image1.src + "\"/>"
    //显示初步诊断结果
    html += '<br><div class="layui-elem-quote" style="font-size:medium;">'
    html += '<p>'
    html += '<p>此图为' + (rectIndex + 1) + '号图片</p>'


    switch (results[rectIndex]['name']) {
      case 'melanoma':
        html += '<p>该病变部位系统根据图像初步识别为：黑色素瘤。</p><p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'nevus':
        html += '该病变部位系统根据图像初步识别为：黑色素痣。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'vitiligo':
        html += '该病变部位系统根据图像初步识别为：白癜风。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'acne':
        html += '该病变部位系统根据图像初步识别为：痤疮。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'corn':
        html += '该病变部位系统根据图像初步识别为：鸡眼。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'tinea_corporis':
        html += '该病变部位系统根据图像初步识别为：体癣。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;
      case 'urticaria':
        html += '该病变部位系统根据图像初步识别为：荨麻疹。<p>请填写下方症状问卷以获得更加准确的诊断结果。</p>';
        break;

    }
    html += '</p></div>'
    html += '<form class="layui-form" >'
    //把这个框的问题输出
    for (var queclass of rect) {
      for (var que of queclass) {
        //html+='<p>'+que['questionContent']+'</p>';
        html += '<div class="layui-form-item">' + '<div class="" style="font-size:large">' + que['questionContent'] + '？</div>' +
          '<div  class="" name="single">' +
          '<input  type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "Y\"" + ' title=\"是\"></input>' +
          '<input  type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "N\"" + ' title=\"否\"></input>' +
          '<input  type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "P\"" + ' title=\"不知道\" checked></input>' +
          '</div>' +
          '</div>'
      }
    }
    rectIndex += 1;
    html += '</form>'
    html += '</div></div>'
  }


  // html += '<br><br><button type="button" class="layui-btn layui-btn-lg layui-btn-radius site-demo-active" data-type="setPercent4" onclick="sendMsg()">提交问卷</button><br><br>'
  document.getElementById("sendMsgBut").style.display = "";
  myout.innerHTML = html;
  form.render();

}

function cutImg(left, top, width, height, container_height, container_width) {

  const canvas_bak = document.createElement('CANVAS');
  const ctx_bak = canvas_bak.getContext('2d');
  canvas_bak.width = container_width;
  canvas_bak.height = container_height;
  ctx_bak.drawImage(image, 0, 0, container_width, container_height);

  var canvas = document.createElement('CANVAS');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(canvas_bak, left, top, width, height,
    0, 0, width, height
  );
  const code = canvas.toDataURL();
  image1.src = code;
}

// 初始化函数
async function setup() {
  // Make a detection with the default image
  var canvasTmp = document.createElement("canvas");
  canvasTmp.width = image.width;
  canvasTmp.height = image.height;
  var ctx = canvasTmp.getContext("2d");
  ctx.drawImage(image, 0, 0);
  var dataURL = canvasTmp.toDataURL("image/png");
  communicate(dataURL)
}

setup();
