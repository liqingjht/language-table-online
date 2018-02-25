var Client = require('ftp');
var fs = require("fs");

exports.upload = function upload(folder, img, path, callback) {
    var client = new Client();
    client.connect({ "host": "172.17.92.251" });

    client.on("ready", function() {
        listRoot(client, undefined).then(function(root) {
            var exist = false;
            for (var i = 0; i < root.length; i++) {
                if (root[i].type == "d" && root[i].name == folder) {
                    exist = true;
                    break;
                }
            }
            if (exist == false) {
                return mkDir(client, folder);
            }
        }).then(function() {
            return cdDir(client, folder);
        }).then(function() {
            return listRoot(client);
        }).then(function(regions) {
            var each = path.split("/");
            var region = each[each.length - 2];
            var exist = false;
            for (var i = 0; i < regions.length; i++) {
                if (regions[i].type == "d" && regions[i].name == region) {
                    exist = true;
                    break;
                }
            }
            if (exist == false) {
                return mkDir(client, region);
            } else
                return region;
        }).then(function(region) {
            return cdDir(client, region);
        }).then(function() {
            var each = img.split("/");
            return putFile(client, img, each[each.length - 1]);
        }).then(function() {
            var each = path.split("/");
            each.pop();
            return putAll(client, each.join("/"));
        }).then(function() {
            client.end();
            callback(false);
        }).catch(function(err) {
            console.log(err)
            client.end();
            callback(err);
        })
    })
};

function listRoot(client) {
    return new Promise(function(resolve, reject) {
        client.list(function(err, data) {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        })
    })
}

function mkDir(client, folder) {
    return new Promise(function(resolve, reject) {
        client.mkdir(folder, function(err) {
            if (err) {
                reject(err)
                return;
            }
            resolve(folder);
        })
    })
}

function cdDir(client, folder) {
    return new Promise(function(resolve, reject) {
        client.cwd(folder, function(err) {
            if (err) {
                reject(err)
                return;
            }
            resolve();
        })
    })
}

function putFile(client, path, name) {
    return new Promise(function(resolve, reject) {
        client.put(path, name, function(err) {
            if (err) {
                reject(err)
                return;
            }
            resolve();
        })
    })
}

function putAll(client, path) {
    try {
        var files = fs.readdirSync(path);
        return Promise.all(files.map(function(file, index) {
            return putFile(client, path + "/" + file, file);
        }))
    } catch (e) {
        console.log(e);
    }
}