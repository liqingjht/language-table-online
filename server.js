var express = require('express');
var bodyParser = require('body-parser');
var fileTree = require("./fileTree.js");
var querystring = require('querystring');
const childProcess = require('child_process');
var schedule = require("node-schedule");
var fs = require("fs");
var ftp = require("./ftp-client.js");

const port = 2048;
var app = express();

app.use(express.static('public'));

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({
	extended: false
})

app.post("/jqueryFileTree", urlencodedParser, function (req, res) {
	res.send(fileTree.listFiles(typeof req.body.dir == "undefined" ? "" : querystring.unescape(req.body.dir)));
})

app.post('/start', jsonParser, function (req, res) {
	var imgPath = req.body.taskImg;
	var langPath = req.body.taskLang;
	if (typeof langPath == "undefined" || typeof langPath == "undefined" || imgPath == "" || langPath == "") {
		res.json({
			result: "fail"
		});
		return false;
	}
	try {
		var tmp = fs.mkdtempSync("./tmp/");
		if (tmp.slice(tmp.length - 1) != "/")
			tmp = tmp + "/";
		var options = {
			env: {
				nodePath: tmp,
				nodeImg: imgPath,
				nodeLang: langPath
			}
		}
		var out = childProcess.spawnSync("./create.sh", [], options);
		if (out.status == 0) {
			var output = out.stdout.toString();
			var lines = output.split("\n");
			var underInfo = false;
			var getInfo = "";
			var isSuccess = false;
			var ftpImgPath = "";
			var ftpZipFolder = "";
			for (var i = 0; i < lines.length; i++) {
				if (lines[i] == "---fileinfo begin---") {
					underInfo = true;
					getInfo += "------ fileinfo.txt ------<br/>";
					continue;
				} else if (lines[i] == "---fileinfo end---")
					underInfo = false;
				if (underInfo == true) {
					getInfo += lines[i] + "<br/>";
					continue;
				}
				if (lines[i].indexOf("[[filePath]]:") == 0) {
					ftpFilePath = lines[i].slice(13);
					continue;
				}
				if (lines[i].indexOf("[[imgPath]]:") == 0) {
					ftpImgPath = lines[i].slice(12);
					continue;
				}
				if (lines[i].indexOf("[[zipPath]]:") == 0) {
					var path = lines[i].slice(12);
					var ftpFolder = req.body.ftpFolder;
					console.log(getInfo.replace(/<br\/>/g, "\n"));
					isSuccess = true;
					break;
				}
			}
			if (isSuccess == false) {
				res.json({
					result: "fail"
				});
				return false;
			} else {
				if (typeof ftpFolder != "undefined" && ftpFolder != "") {
					ftp.upload(ftpFolder, ftpImgPath, ftpFilePath, function (err) {
						if (!err) {
							res.json({
								result: "success",
								download: path,
								info: getInfo,
								ftp: "success"
							});
						} else
							res.json({
								result: "success",
								download: path,
								info: getInfo,
								ftp: "fail"
							});
					});
				} else
					res.json({
						result: "success",
						download: path,
						info: getInfo,
						ftp: "notUpload"
					});
			}
		} else {
			res.json({
				result: "fail"
			});
			return false;
		}
	} catch (e) {
		console.log(e);
		res.json({
			result: "fail"
		});
		return false;
	}
});

app.get("/download", function (req, res) {
	noCache(res);
	var file = req.query.file;
	if (typeof file != "undefined" && file != "") {
		res.type("application/binary");
		res.download(file);
	} else {
		res.json({
			status: "fail"
		});
	}
})

var server = app.listen(port, function () {
	console.log('Language table web site start at ' + (new Date).toLocaleString());
});

var rule = new schedule.RecurrenceRule();
rule.hour = 3;
rule.minute = 0;
rule.second = 0;

clearTmpFolder();
schedule.scheduleJob(rule, function () {
	clearTmpFolder();
})

function noCache(res) {
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
}

function clearTmpFolder() {
	try {
		childProcess.execSync("rm -rf ./tmp/*");
	} catch (e) {
		console.log("clear tmp folder failed");
	}
}
