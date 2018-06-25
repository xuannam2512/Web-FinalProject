function chooseActive(selectObject) {
    var id = selectObject.value;
    console.log(id);
    if(id == 'homeLink') {
        $('#home').addClass('table-active');
    }
    $('#home').addClass('table-active');
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#imgUser')
                .attr('src', e.target.result);
            $('#imgInfoUser')
                .attr('src', e.target.result);
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function removeImage() {
    $('#imgUser').attr('src', '');
}

function increaseAmount() {
    var amount = document.getElementById("amount").value;
    $('#amount').attr('value', parseInt(amount) + 1);
}

function decreaseAmount() {
    var amount = document.getElementById("amount").value;
    if (parseInt(amount) <= 1) {
        
    } else {
        $('#amount').attr('value', parseInt(amount) - 1);
    }
}