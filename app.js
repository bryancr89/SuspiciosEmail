$(document).ready(function(){
	$('#submit').click(function(){
		var data = $('#settings').serialize();
		$.ajax({
			url: 'submit', 
			type: 'POST', 
			dataType: 'json',
            data: data
	    });
	});

	$('form').submit(function(e){
		e.preventDefault();
	});
});