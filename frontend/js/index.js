
const image = document.getElementById('image'); 
const canvas = document.getElementById('canvas');
const warning = document.getElementById('warning');
const fileInput = document.getElementById('fileUploader');
const myout = document.getElementById('myout');
// const URL = "http://localhost:5000/predict/"
// const URL = "http://192.168.16.121:5000/predict/"


// 获取服务器端URL 
function GetUrl()
　　{
	var protocol = window.location.protocol.toString();
	// var host =  window.location.host.toString();
	var host =  document.domain.toString();
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


// 发送图片到服务器, 接收检测结果,就是后端传过来的box，并在canvas上绘图 
function communicate(img_base64_url) {
//使用AJAX
  $.ajax({
    url: URL,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({"image": img_base64_url}), //使用base64编码
    dataType: "json"
  }).done(function(response_data) {
      //console.log(response_data);
      if(response_data == null){
        alert("此图片未识别出病变部位，请调整拍摄角度以及灯光")
      }
      else{
        //alert(response_data.class_results[1]['name'])
        console.log(response_data.class_results)//可以把标准框附件的类输出出来
        console.log(response_data.disease_table)
        console.log(response_data.question_table)
        drawResult(response_data.results);
        output(response_data.question_table);
      }
  });
}


// 处理用户上传图片，发送至服务器并绘制检测结果 
function parseFiles(files) {
  const file = files[0];
  const imageType = /image.*/;
  if (file.type.match(imageType)) {
    warning.innerHTML = '';
    const reader = new FileReader();
    reader.readAsDataURL(file);
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

// 上传图片按钮的回调函数
function clickUploader() {
  canvas.style.display = "none";
  fileInput.click();
  
}

// 选择预测框绘制颜色
function selectColor(index) {
  var colors = ["blue", "fuchsia", "green", "lime", "maroon", "navy", "olive", "orange", "purple", "red", "silver", "teal", "white", "yellow", "aqua", "black", "gray"];

  i = index % 18;
  var color = colors[i];
  return color;

}

// 在图片上绘制检测结果
function drawResult(results) {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    var index = 0;
    var totalClasses=new Array(); 
    for(bboxInfo of results) { 
      bbox = bboxInfo['bbox'];
      class_name = bboxInfo['name'];
      score = bboxInfo['conf'];

      ctx.beginPath();
      ctx.lineWidth="4";

      if (totalClasses.includes(class_name) == false) 
        {
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
      
      ctx.font="20px Arial";
      
      let content = class_name + " " + parseFloat(score).toFixed(2);
      ctx.fillText(content, bbox[0], bbox[1] < 20 ? bbox[1] + 30 : bbox[1]-5);
  }
  canvas.style.display = ""; //画完了才显示出图片，新加的，后面还要隐藏问卷等
}

//把各框截图和问卷循环写到主页
function output(question_table){
  // console.log(question_table)
  // for(var i = 0; i < question_table.length; i++){
  //   //console.log(rect)
  //   var html='';
  //   for(var j = 0; j < question_table[i].length; j++){
  //     //console.log(eachclass)
  //     for(var k = 0; k < question_table[i][j].length; k++){
  //       //console.log(eachque['questionContent']) 
  //       html+='<p>'+question_table[i][j][k]['questionContent']+'</p>';
  //       myout.innerHTML = html;
  //     }
  //   }
  // }
  //不能用for in 一定要用for of
  //不能用class作为变量名
  for(var rect of question_table){
    var html='';
    for(var queclass of rect){
      for(var que of queclass){
        html+='<p>'+que['questionContent']+'</p>';
        myout.innerHTML = html;
      }
    }
  }
  
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
