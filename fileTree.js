const childProcess = require('child_process');

const shareFolder = "/dnishare/";
const personalFolder = "/home/";
const projectFolder = "/home2/Project/";
const shareIgnore = ["bak"];
const personalIgnore = ["test"];

function scanFolder(dir) {
    var out = childProcess.spawnSync("tree", ["-f", "-L", "1", "-i", "-F", "-P", "*.img|*.zip|*.tar.gz", dir]);
    var result = new Array();
    if (out.error)
        return [];
    var lines = out.stdout.toString().split("\n");
    lines.splice(0, 1);
    if (lines.length > 2);
    lines.splice(lines.length - 3, 3);
    for (var i = 0; i < lines.length; i++) {
        var root = isValidRoot(lines[i]);
        if (root == -1)
            continue;
        else if (root == "share") {
            if (isIgnoreFolder(lines[i], shareFolder, shareIgnore))
                continue;
        } else if (root == "personal") {
            if (isIgnoreFolder(lines[i], personalFolder, personalIgnore))
                continue;
        }

        if (isFolder(lines[i]) == false && isValidFile(lines[i]) == false)
            continue;

        result.push(lines[i]);
    }

    return result;
}

function isIgnoreFolder(path, root, folders) {
    for (var i = 0; i < folders.length; i++) {
        if (path.indexOf(root + folders[i] + "/") == 0)
            return true;
    }

    return false;
}

function isFolder(path) {
    return path.slice(path.length - 1) == "/";
}

function isValidFile(path) {
    var file = getFileName(path);
    if (/-v(\d{1,3}\.){3}\d{1,3}/gi.test(file) == false)
        return false;
    if (file.indexOf("u-boot-hw") == 0)
        return false;
    return true;
}

function getDirList(dir) {
    var r = '<ul class="jqueryFileTree" style="display: none;">';
    try {
        r = '<ul class="jqueryFileTree" style="display: none;">';
        var files = scanFolder(dir);
        for (var i = 0; i < files.length; i++) {
            var path = files[i];
            var file = getFileName(path);
            file = removeLast(file);
            if (isFolder(path)) {
                r += '<li class="directory collapsed"><a href="#" rel="' + path + '">' + file + '</a></li>';
            } else {
                var ext = getExtName(file);
                r += '<li class="file ext_' + ext + '"><a href="#" rel="' + removeLast(path) + '">' + file + '</a></li>';
            }
        }

        if (files.length == 0) {
            r += '<li class="not-exit' + ext + '">Can not find any image or language table</li>';
        }

        r += '</ul>';
    } catch (e) {
        r += 'Could not load directory: ' + dir;
        r += '</ul>';
    }

    return r;
}

function getFileName(path) {
    path = removeLast(path);
    var each = path.split("/");
    if (each.length > 0)
        return each[each.length - 1];
    else
        return "";
}

function getExtName(file) {
    var each = file.split(".");
    if (each[each.length - 1] == "zip")
        return "zip";
    else if (each[each.length - 1] == "img")
        return "img";
    else if (each[each.length - 2] == "tar" && each[each.length - 1] == "gz")
        return "tar";
    else
        return "";
}

function removeLast(path) {
    if (path.slice(path.length - 5) == ".zip*" || path.slice(path.length - 5) == ".img*")
        return path.slice(0, path.length - 1);
    else if (path.slice(path.length - 5) == ".tar.gz*")
        return path.slice(0, path.length - 1);
    else if (path.slice(path.length - 1) == "/")
        return path.slice(0, path.length - 1);
    else
        return path;
}

function isValidRoot(path) {
    if (path.indexOf(shareFolder) == 0)
        return "share";
    else if (path.indexOf(projectFolder) == 0)
        return "project";
    else if (path.indexOf(personalFolder) == 0)
        return "personal";
    else
        return -1;
}

function listFiles(dir) {
    if (dir == "/rootDir/") {
        var r = '<ul class="jqueryFileTree" style="display: none;">';
        r += '<li class="directory collapsed"><a href="#" rel="' + shareFolder + '">172.17.92.250</a></li>';
        r += '<li class="directory collapsed"><a href="#" rel="' + projectFolder + '">172.17.92.252/Project</a>';
        r += getDirList(projectFolder);
        r += '</li>';
        r += '<li class="directory collapsed"><a href="#" rel="' + personalFolder + '">172.17.92.252/<Personal></a></li>';

        return r;
    }

    if (isValidRoot(dir) == -1)
        return "";

    return getDirList(dir);
}

exports.listFiles = listFiles;