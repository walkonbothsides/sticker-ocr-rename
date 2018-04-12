var AipOcrClient = require("baidu-aip-sdk").ocr;
var fs = require('fs');
var path = require('path');

// http://ai.baidu.com/docs#/OCR-Node-SDK/3b798b48
var APP_ID = "YOUR_APP_ID";
var API_KEY = "YOUR_API_KEY";
var SECRET_KEY = "YOUR_SECRET_KEY";

// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);

// String -> [String]
function imageFileList(dir) {
    return fs.readdirSync(dir).reduce(function(list, file) {
        var name = path.join(dir, file);
        var isImage =  path.extname(file).match(/\.(jpeg|jpg|gif|png)$/) != null;
        var isDir = fs.statSync(name).isDirectory();
        return list.concat(isDir || !isImage ? [] : [name]);
    }, []);
}


// 调用通用文字识别, 图片参数为本地图片

async function run() {
    let info = new Map();
    let images = imageFileList("./origin");

    for (let i = 0; i < images.length; i++) {
        let image_path = images[i];
        let image = fs.readFileSync(image_path).toString("base64");

        try {
            let result = await client.generalBasic(image);
            console.info('received result', result);
            info.set(image_path, result);
        } catch (err) {
            // 如果发生网络错误
            console.log(err);
        }
    }
    return info;
}

function rename(path, newName) {
    console.log(`renameing ${path} to ${newName}`);
    return new Promise(function (resolve, reject) {
        fs.rename(path, newName, function(err) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        });
    })
}

run().then(async (info) => {
    console.log("all image transfer success", info.size)
    for (let [path, details] of info.entries()) {
        console.log("details",details)
        if (details.words_result_num > 0) {
            let ext = path.split('.').pop();
            let words = details.words_result.map((item) => item.words).join('');
            let newName = `./translate/${words}.${ext}`
            await rename(path, newName);
        }
    }
})