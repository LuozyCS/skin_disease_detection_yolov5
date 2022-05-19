var form;
layui.use('form',function(){
form = layui.form;
});
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
  return url;
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
      alert("此图片未识别出病变部位，请调整拍摄角度以及灯光")
    }
    else {
      //alert(response_data.class_results[1]['name'])
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

    html += '<div class="layui-tab layui-tab-brief" lay-filter="docDemoTabBrief">' +
      '<ul class="layui-tab-title">' +
      '<li class="layui-this">综合诊断结果与建议</li>' +
      '<li>详细诊断结果</li>' +
      '</ul>' +
      '<div class="layui-tab-content" style="">' +
      '<div class="layui-tab-item layui-show">综合诊断结果为：' + sugges['n'] + '<br>治疗建议：' + sugges['s'] + '</div>' +
      '<div class="layui-tab-item">' +
      '各疾病综合诊断分数（0到1）：<br>' +
      '<div style="overflow-x:auto">' +
      '<table class="layui-table" lay-skin="line"><colgroup><col width="20%"><col width="40%"><col width="40%"><col></colgroup><thead>' +
                  '<tr>'+
                    '<th>疾病种类</th>' +
                    '<th>图像诊断分数</th>' +
                    '<th>综合诊断分数</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  '<tr>' +
                    '<td>黑色素瘤</td>'+
                    '<td>' + origin[rectIndex][0] + '</td>' +
                    '<td>' + dis[rectIndex][0] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>黑色素痣</td>'+
                    '<td>' + origin[rectIndex][1] + '</td>' +
                    '<td>' + dis[rectIndex][1] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>痤疮</td>'+
                    '<td>' + origin[rectIndex][2] + '</td>' +
                    '<td>' + dis[rectIndex][2] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>荨麻疹</td>'+
                    '<td>' + origin[rectIndex][3] + '</td>' +
                    '<td>' + dis[rectIndex][3] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>体癣/td>'+
                    '<td>' + origin[rectIndex][4] + '</td>' +
                    '<td>' + dis[rectIndex][4] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>鸡眼</td>'+
                    '<td>' + origin[rectIndex][5] + '</td>' +
                    '<td>' + dis[rectIndex][5] + '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td>白癜风</td>'+
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

  let promise = navigator.mediaDevices.getUserMedia(constraints);
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

      // let tmpImg = new Image();
      // tmpImg.src = e.target.result;;
      // tmpImg.onload = function(){
      //   realHeight = this.height;
      //   realWidth = this.width;
      // }
      // console.log("........................")
      // console.log(realHeight+"/"+realWidth+"/"+image.height+"/"+image.width);

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

    let content = class_name + " " + parseFloat(score).toFixed(2);
    ctx.fillText(content, bbox[0], bbox[1] < 20 ? bbox[1] + 30 : bbox[1] - 5);
  }
  //画完了才显示出图片，新加的，后面还要隐藏问卷等

  document.getElementById('video').style.display = "none";
  canvas.style.display = "";
  myout.style.display = "";
  document.getElementById('image').style.display = "";
  document.getElementById('jcjg').style.display = "";
}

//把各框截图和问卷循环写到主页
function output(question_table, results) {

  //不能用for in 一定要用for of
  //不能用class作为变量名
  var rectIndex = 0;
  var html = '';
  
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
    html += '<form class="layui-form" >'
    //把这个框的问题输出
    for (var queclass of rect) {
      for (var que of queclass) {
        //html+='<p>'+que['questionContent']+'</p>';
        html += '<div class="layui-form-item">' + '<div class="">' + que['questionContent'] + '</div>'+
          '<div class="layui-input" name="single">' +
          '<input type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "Y\"" + ' title=\"是\"></input>' +
          '<input type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "N\"" + ' title=\"否\"></input>' +
          '<input type="radio" name="place' + rectIndex + "Q" + que['id'] + '\" value=\"' + rectIndex + "Q" + que['id'] + "P\"" + ' title=\"不知道\" checked></input>' +
          '</div>' +
          '</div>' 
      }
    }
    rectIndex += 1;
    html += '</form>'
    html += '</div></div>'
  }
  

  html += '<button type="button" class="layui-btn layui-btn-lg" onclick="sendMsg()">提交问卷</button>'

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
