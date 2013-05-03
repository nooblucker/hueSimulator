$(function() {

    var logError = function(response) {
        $("#log").prepend("<div class='error log'>" + response.status + " " + response.statusText + "</div>");
    };

    $("#linkbutton").on("click", function(event) {
        event.preventDefault();
        $.ajax({
            url: '/linkbutton'
        }).done(function(response) {
            $("#log").prepend("<div class='info log'>" + response + "</div>");
        }).fail(logError);
    });
    
    $("#commands button").on("click", function() {
        var $this = $(this);
        var body = $this.attr("data-body");
        var url = $this.attr("data-url");
        var method = $this.attr("data-method");
        
        $("input[name='req-method'][value='"+method+"']").prop("checked", true);
        $("#req-url").val(url);
        $("#req-body").val(body);
    });

    $("#request").on("submit", function(event) {
        event.preventDefault();

        var url = $("#req-url").val();
        var method = $("input[name='req-method']:checked").val();
        var body = $("#req-body").val();
        var data;
        try {
            if (body !== "") {
                data = JSON.parse(body);
                body = "<pre>"+body+"</pre>";
            }
        } catch (e) {
            alert('malformed json: ' + e);
            return;
        }

        $("#log").prepend("<div class='request log'>" + method + " " + url + " " + body + "</div>");

        var req = $.ajax({
            url: url,
            method: method,
            data: data,
            dataType: "json"
        });

        req.done(function(response) {
            $("#log").prepend("<div class='response log'><pre>" + JSON.stringify(response) + "</pre></div>");
        });

        req.fail(logError);

    });
});