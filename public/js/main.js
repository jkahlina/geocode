$(function() {
  $("#form").submit(function(e){
    e.preventDefault();

    showLoading(true);

    // TODO: front-end validation
    var formData = new FormData($(this)[0]);

    $.ajax({
      url: '/addresses',
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function(data) {
        var tableBody = $("#results tbody");
        if(data.addresses) {
          for(var i=0; i< data.addresses.length; i++){
            var row = $("<tr>");
            row.append(createColumn(i+1));

            var address = data.addresses[i];
            row.append(createColumn(address.address));
            row.append(createColumn(address.geocode.lat));
            row.append(createColumn(address.geocode.lng));

            tableBody.append(row);
          }
          showLoading(false);
          $("#results").show();
        }
      },
      error: function(data) {
        showLoading(false);
        var errorMsg = "Unknown error. Please try again later.";
        if(data.responseJSON) {
          errorMsg = data.responseJSON.error;
        }
        $("#errorMsg").html(errorMsg);
        $("#error").show();
      }
    });
  });

  function createColumn(text) {
    return "<td>"+text+"</td>";
  }

  var interval;
  var progressCount;

  function showLoading(show) {
    if(show) {
      setProgressCount(10);

      $("#submission").hide();
      $("#loading").show();
      $("#error").hide();
      $("#results").hide();

      interval = setInterval(updateProgress, 1500);
    } else {
      clearInterval(interval);
      $("#submission").show();
      $("#loading").hide();
    }
  }

  function updateProgress() {
    setProgressCount((progressCount+10)%110);
  }

  function setProgressCount(count) {
    progressCount = count;
    $(".progress-bar").css("width", progressCount+"%");
  }
});