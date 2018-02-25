function ajax_download(url) {
    var $iframe;
    $("#download_iframe").remove();

    $iframe = $("<iframe id='download_iframe'" +
        " style='display: none' src='" + url + "'></iframe>"
    ).appendTo("body");
}

$(document).ready(function() {
    $('#containerTree').fileTree({
        root: '/rootDir/',
        script: 'jqueryFileTree',
        expandSpeed: 500,
        collapseSpeed: 500,
        multiFolder: false
    }, function(path) {
        fillFileInfo(path);
    });

    $("#updown img").on("click", function() {
        var file = $("#image-val").html();
        var path = $("#image-val").attr("data-path");
        $("#image-val").html($("#lang-val").html());
        $("#image-val").attr("data-path", $("#lang-val").attr("data-path"));
        $("#lang-val").html(file);
        $("#lang-val").attr("data-path", path);
        var ftpFolder = $("#image-val").html().replace(/-v(\d{1,3}\.){3}\d{1,3}.*/gi, "").toLowerCase();
        $("#ftp-path").html(ftpFolder);
    });
});

function fillFileInfo(path) {
    var each = path.split("/");
    var file = each[each.length - 1];
    each = file.split(".");
    var ext = each[each.length - 1];
    var img = $("#image-val");
    var lang = $("#lang-val");
    var target;
    if (ext == "img")
        target = img;
    else if (ext == "gz")
        target = lang;
    else if (ext == "zip") {
        if (img.html() == "")
            target = img;
        else if (lang.html() == "")
            target = lang;
        else
            target = img;
    }

    target.html(file);
    target.attr("data-path", path);
    var ftpFolder = img.html().replace(/-v(\d{1,3}\.){3}\d{1,3}.*/gi, "").toLowerCase();
    $("#ftp-path").html(ftpFolder);
}

function showAlert(flag, str) {
    $("#alert-body").remove();
    var alert_body = $('<div class="alert alert-dismissible" role="alert" id="alert-body"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span></span></div>');
    if (flag == "Warning") {
        alert_body.addClass("alert-warning");
    } else if (flag == "Error") {
        alert_body.addClass("alert-danger");
    } else if (flag == "Success") {
        alert_body.addClass("alert-success");
    }
    alert_body.children("span").html(flag + "! " + str);
    alert_body.children("span").css("word-break", "break-word");
    alert_body.appendTo("#alert-row");
    $("#alert-bar").css("visibility", "visible");
    setTimeout(function() {
        $("#alert-bar").css("visibility", "hidden");
    }, 8000);
}

$("#startBtn").on("click", function() {
    var img = $("#image-val");
    var lang = $("#lang-val");
    if (img.html() == "" && lang.html() == "") {
        showAlert("Error", "Select image file and language table");
        return false;
    } else if (img.html() == "") {
        showAlert("Error", "Select image file");
        return false;
    } else if (lang.html() == "") {
        showAlert("Error", "Select language table");
        return false;
    }
    var imgPath = img.attr("data-path");
    var langPath = lang.attr("data-path");
    if (imgPath == "" || langPath == "") {
        showAlert("Error", "May occur error. Contact Defeng.Liu");
        return false;
    }

    $.ajaxSetup({ "contentType": "application/json" })

    if ($("#to-upload").get(0).checked == true)
        var upload = $("#ftp-path").html();
    else
        var upload = "";

    var postData = {
        taskImg: imgPath,
        taskLang: langPath,
        ftpFolder: upload
    }

    $.post("/start", JSON.stringify(postData), function(data, status) {
        $("#startBtn").attr("disabled", false);
        if (data.result == "fail")
            showAlert("Error", "Check files or contact Defeng.Liu");
        else if (data.result == "success") {
            if (data.ftp == "fail")
                showAlert("Success", "Generate successfully but upload to ftp server failed");
            else if (data.ftp == "success")
                showAlert("Success", "Generate and upload successfully");
            else if (data.ftp == "notUpload")
                showAlert("Success", "Generate successfully and no need to upload to ftp server");
            $("#get-info").html(data.info)
            ajax_download("/download?file=" + data.download);
        } else
            showAlert("Error", "May occur error. Contact Defeng.Liu");
    })

    $("#startBtn").attr("disabled", true);
})